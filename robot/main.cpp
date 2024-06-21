#include <iostream>
#include <cstring>
#include <arpa/inet.h>
#include <unistd.h>
#include <thread>
#include <random>

#define SEND_PORT 65306
#define RECEIVE_PORT 65305
#define SERVER_IP "127.0.0.1"
#define BUFFER_SIZE 10

#pragma pack(push, 1)  // Disable padding
struct DataPacket {
    uint8_t command;
    uint8_t strategy;
    int32_t x_pos;
    int32_t y_pos;
};
#pragma pack(pop)  // Restore the default alignment

std::random_device rd;
std::mt19937 gen(rd());

void send_packets() {
    int sockfd;
    struct sockaddr_in servaddr;

    // Create socket
    if ((sockfd = socket(AF_INET, SOCK_DGRAM, 0)) < 0) {
        perror("Socket creation failed");
        return;
    }

    memset(&servaddr, 0, sizeof(servaddr));

    // Fill server information
    servaddr.sin_family = AF_INET;
    servaddr.sin_port = htons(SEND_PORT);
    servaddr.sin_addr.s_addr = inet_addr(SERVER_IP);

    // Random number distributions
    std::uniform_int_distribution<> command_dist(0, 255);
    std::uniform_int_distribution<> strategy_dist(0, 255);
    
    // Start position 
    int32_t x_pos = 0;
    int32_t y_pos = 0;

    while (true) {
        DataPacket packet;
        packet.command = command_dist(gen);
        packet.strategy = strategy_dist(gen);
        packet.x_pos = x_pos;
        packet.y_pos = y_pos;
        
        y_pos += 100;
       
        // Send data 
        ssize_t sent_size = sendto(sockfd, &packet, sizeof(packet), 0, (const struct sockaddr *)&servaddr, sizeof(servaddr));
        if (sent_size != sizeof(packet)) {
            perror("Failed to send packet");
        } else {
            std::cout << "Packet sent\n";
        }
        sleep(1); 
    }

    close(sockfd);
}

void receive_packets() {
    int sockfd;
    char buffer[BUFFER_SIZE];
    struct sockaddr_in servaddr, cliaddr;
    socklen_t len = sizeof(cliaddr);

    if ((sockfd = socket(AF_INET, SOCK_DGRAM, 0)) < 0) {
        perror("Socket creation failed");
        return;
    }

    memset(&servaddr, 0, sizeof(servaddr));
    memset(&cliaddr, 0, sizeof(cliaddr));

    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = INADDR_ANY;
    servaddr.sin_port = htons(RECEIVE_PORT);

    // Bind the socket with the server address
    if (bind(sockfd, (const struct sockaddr *)&servaddr, sizeof(servaddr)) < 0) {
        perror("Bind failed");
        close(sockfd);
        return;
    }

    while (true) {
        int n = recvfrom(sockfd, buffer, BUFFER_SIZE, MSG_WAITALL, (struct sockaddr *)&cliaddr, &len);
        if (n != BUFFER_SIZE) {
            std::cerr << "Unexpected packet size: " << n << " bytes\n";
            continue;
        }

        DataPacket packet;
        std::memcpy(&packet, buffer, sizeof(packet));

        //std::cout << "Received command: " << static_cast<int>(packet.command) << "\n";
        //std::cout << "Received strategy: " << static_cast<int>(packet.strategy) << "\n";
        //std::cout << "Received x_pos: " << packet.x_pos << "\n";
        //std::cout << "Received y_pos: " << packet.y_pos << "\n";
    }

    close(sockfd);
}

int main() {
    // std::thread send_thread(send_packets);
    std::thread receive_thread(receive_packets);

    // send_thread.join();
    receive_thread.join();

    return 0;
}
