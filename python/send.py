import socket
import struct
import threading
from omegaconf import OmegaConf
from util import load_config
import os

here = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(here, "config.yaml")
config: OmegaConf = load_config(config_path)

# Thread control flag
stop_threads = threading.Event()

# Create socket for receiving messages from JavaScript
receive_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receive_sock_js.bind((config.UDP_IP_CPP, config.UDP_RECEIVE_PORT_JS))
# Create socket for sending messages to C++
send_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def send_message():
    """
    Function to receive messages from JavaScript and SEND it to C++.

    This function continuously listens for incoming messages from a JavaScript client.
    It receives the messages using a UDP socket and prints the received message along with the sender's address.
    
    TODO: Decode the message to have a list of: command, strategy, x_pos, y_pos

    Raises:
        Exception: If there is an error while receiving the message.

    """
    while not stop_threads.is_set():
        try:
            data, addr = receive_sock_js.recvfrom(1024)
            try:
                message = data.decode()
                print(f"Received message from JavaScript: {message} from {addr}")
                command = 0
                strategy = 0
                x_pos = 0
                y_pos = 0
            except UnicodeDecodeError:
                print(f"Received non-UTF-8 message from JavaScript: {data} from {addr}")
            encoded_data = struct.pack(config.format, command, strategy, x_pos, y_pos)
            send_sock_cpp.sendto(encoded_data, (config.UDP_IP_CPP, config.UDP_SEND_PORT_CPP))
        except Exception as e:
            print(f"Error in send_message: {e}")


if __name__ == "__main__":
    try:        
        print("Starting send thread")
        send_thread = threading.Thread(target=send_message)
        
        send_thread.start()
        send_thread.join()
    except KeyboardInterrupt:
        print("Manual program interruption")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        stop_threads.set()  # Signal threads to stop
        send_sock_cpp.close()
        receive_sock_js.close()
        print("Sockets closed and threads stopped.")
