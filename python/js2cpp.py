import socket
import struct
import threading
from util import Command

class Js2Cpp(threading.Thread):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.stop_threads = threading.Event()
        self.receive_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.receive_sock_js.bind((config.MY_IP, config.UDP_RECEIVE_PORT_JS))
        self.send_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def update(self):
        """
        Function to receive messages from JavaScript and SEND it to C++.

        This function continuously listens for incoming messages from a JavaScript client.
        It receives the messages using a UDP socket and prints the received message along with the sender's address.

        Raises:
            Exception: If there is an error while receiving the message.

        """
        while not self.stop_threads.is_set():
            command_number, strategy_number, x_position, y_position = self.receive_from_js()
            self.send_to_cpp(command_number, strategy_number, x_position, y_position)
    
    
    def receive_from_js(self) -> tuple[int, int, int, int]:
        try:
            data, addr = self.receive_sock_js.recvfrom(1024)
        except Exception as e:
            print(f"Error in receiving the message: {e}")
        try:
            message = data.decode()
        except UnicodeDecodeError:
            print(f"Received non-UTF-8 message from JavaScript: {data} from {addr}")
        message_split = message.split('|')[1]
        content_message = message_split.split(',')
        task_type = content_message[2]
        command_number = Command[task_type].value
        task_id = int(content_message[3])
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
    
    def send_to_cpp(self, command_number: int, strategy_number: int, x_position: int, y_position: int):
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
            self.send_sock_cpp.sendto(encoded_data, (self.config.UDP_IP_CPP, self.config.UDP_SEND_PORT_CPP))
            print(f"Sending message to C++: {encoded_data}")
        except Exception as e:
            print(f"Error in send_message: {e}")
        

    def run(self):
        try:
            thread = threading.Thread(target=self.update)
            thread.start()
            thread.join()
        except KeyboardInterrupt:
            print("Manual program interruption")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        finally:
            self.stop()
    
    def stop(self):
        self.stop_threads.set()
        self.send_sock_cpp.close()
        self.receive_sock_js.close()
        print("Sockets closed and threads stopped.")