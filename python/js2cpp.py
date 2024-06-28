import socket
import struct
import threading
from omegaconf import OmegaConf
from util import Command, load_config
import os

here = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(here, "config.yaml")
config: OmegaConf = load_config(config_path)

# Thread control flag
stop_threads = threading.Event()

# Create socket for receiving messages from JavaScript
receive_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receive_sock_js.bind(("127.0.0.1", config.UDP_RECEIVE_PORT_JS))
# Create socket for sending messages to C++
send_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def update():
    """
    Function to receive messages from JavaScript and SEND it to C++.

    This function continuously listens for incoming messages from a JavaScript client.
    It receives the messages using a UDP socket and prints the received message along with the sender's address.
    
    Raises:
        Exception: If there is an error while receiving the message.

    """
    while not stop_threads.is_set():
        try:
            data, addr = receive_sock_js.recvfrom(1024)
            try:
                message = data.decode()
                message_split = message.split('|')[1]
                content_message = message_split.split(',')
                task_type = content_message[2]
                task_id = int(content_message[3])
                strategy_number = int(content_message[5])
                task_label = content_message[4]
                selection = content_message[1]
                print(f"Task Type: {task_type}")
                print(f"Task Label: {task_label}")
                print(f"Task ID: {task_id}")
                print(f"Strategy Number: {strategy_number}")
                if(selection == "selection"):
                    x_position = int(content_message[6])
                    y_position = int(content_message[7])
                    print(f"X Position: {x_position}")
                    print(f"Y Position: {y_position}")
            except UnicodeDecodeError:
                print(f"Received non-UTF-8 message from JavaScript: {data} from {addr}")
            command_number = Command[task_type].value
            encoded_data = struct.pack(config.command_format, command_number, strategy_number, x_position, y_position)
            print(f"Sending message to C++: {encoded_data}")
            send_sock_cpp.sendto(encoded_data, (config.UDP_IP_CPP, config.UDP_SEND_PORT_CPP))
        except Exception as e:
            print(f"Error in send_message: {e}")


if __name__ == "__main__":
    try:        
        thread = threading.Thread(target=update)
        thread.start()
        thread.join()
    except KeyboardInterrupt:
        print("Manual program interruption")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        stop_threads.set()  # Signal threads to stop
        send_sock_cpp.close()
        receive_sock_js.close()
        print("Sockets closed and threads stopped.")
