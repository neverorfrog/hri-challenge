import socket
import struct
import select
from communication.utils import Command, SocketThread

class CommandSender(SocketThread):
    def __init__(self, config):
        super().__init__(config)
        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._server_socket.bind((config.local_ip, config.command_receive_port))
        # self.speech_server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # self.speech_server_socket.bind((config.local_ip, config.speech_port))
        
        self._client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def update(self):
        """
        Function to receive messages from JavaScript and SEND it to C++.

        This function continuously listens for incoming messages from a JavaScript client.
        It receives the messages using a UDP socket and prints the received message along with the sender's address.

        Raises:
            Exception: If there is an error while receiving the message.

        """
        # CODE TO MANAGE MESSAGES ON TWO DIFFERENT PORTS
        # sockets_to_monitor = [self._server_socket, self.speech_server_socket]
        # while not self.stop_threads.is_set():
        #     print("OK")
        #     readable, _, _ = select.select(sockets_to_monitor, [], [])
        #     for sock in readable:
        #         # self.receive_command()
        #         command_number, strategy_number, x_position, y_position = self.receive_command()
        #         self.send_command_to_cpp(command_number, strategy_number, x_position, y_position)
        
        # CODE TO MANAGE MESSAGES ON THE SAME PORT
        while not self.stop_threads.is_set():
            print("OK")
            command_number, strategy_number, x_position, y_position = self.receive_command()
            self.send_command_to_cpp(command_number, strategy_number, x_position, y_position)
    
    # Receive command from JavaScript or from Speech recognition thread
    def receive_command(self) -> tuple[int, int, int, int]:
        try:
            data, addr = self.server_socket.recvfrom(1024)
        except Exception as e:
            print(f"Error in receiving the message: {e}")
        try:
            message = data.decode()
            print("message:     ", message)
        except UnicodeDecodeError:
            print(f"Received non-UTF-8 message from JavaScript: {data} from {addr}")
        message_split = message.split('|')[1]
        content_message = message_split.split(',')
        task_type = content_message[2]
        command_number = Command[task_type].value
        strategy_number = int(content_message[5])
        task_label = content_message[4]
        selection = content_message[1]
        print(f"Task Label: {task_label}")
        if selection == "selection":
            x_position = int(content_message[6])
            y_position = int(content_message[7])
            print(f"X Position: {x_position}")
            print(f"Y Position: {y_position}")
        else:
            x_position = 0
            y_position = 0
        return command_number, strategy_number, x_position, y_position
    
    def send_command_to_cpp(self, command_number: int, strategy_number: int, x_position: int, y_position: int):
        if command_number > self.config.command_offset:
            command_body_number = Command.Null.value
            command_head_number = command_number - self.config.command_offset
        else:
            command_body_number = command_number
            command_head_number = Command.Null.value
        encoded_data = struct.pack(
            self.config.command_format,
            command_body_number,
            command_head_number,
            strategy_number,
            x_position,
            y_position
        )
        try:
            self.client_socket.sendto(encoded_data, (self.config.robot_ip, self.config.command_send_port))
            print(f"Sending message to C++: {encoded_data}")
        except Exception as e:
            print(f"Error in send_message: {e}")