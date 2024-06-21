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

# Create socket for receiving messages from C++
receive_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receive_sock_cpp.bind((config.UDP_IP_CPP, config.UDP_RECEIVE_PORT_CPP))
# Create socket for sending messages to JavaScript
send_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def receive_message():
    """
    RECEIVES messages from C++ and sends them to a JavaScript server.

    This function continuously receives data from a C++ socket and processes it. 
    It unpacks the received data and sends specific messages to a JavaScript server 
    using different UDP ports. It also calculates and updates the positions of 
    autonomous and controlled robots.

    Raises:
        Exception: If there is an error in receiving or processing the data.

    """
    while not stop_threads.is_set():
        try:
            data, addr = receive_sock_cpp.recvfrom(1024)
            if len(data) == struct.calcsize(config.format):
                command, strategy, x_pos, y_pos = struct.unpack(config.format, data)
                message2 = f"|timeleft:{x_pos}"
                send_sock_js.sendto(message2.encode(), (config.UDP_IP_CPP, config.UDP_SEND_PORT_JS))
                message3 = f"|score:{y_pos}"
                send_sock_js.sendto(message3.encode(), (config.UDP_IP_CPP, config.UDP_SEND_PORT_JS))
                message4 = f"|packets-left:{strategy}"
                send_sock_js.sendto(message4.encode(), (config.UDP_IP_CPP, config.UDP_SEND_PORT_JS))  
                x_autonomous = -x_pos
                y_autonomous = -y_pos
                x_controlled = x_pos
                y_controlled = y_pos
                pose_Autonomous = f"4, {-1},{x_autonomous}, {y_autonomous}"
                pose_Controlled = f"3, {-2},{x_controlled}, {y_controlled}"
                robotPose = f"{pose_Autonomous};{pose_Controlled}"
                message1 = f"|robotAutonomousAndControlled:{robotPose}"
                send_sock_js.sendto(message1.encode(), (config.UDP_IP_CPP, config.UDP_SEND_PORT_JS))           
                #print(f"Received command from C++: {command}, strategy: {strategy}, x_pos: {x_pos}, y_pos: {y_pos}")
            else:
                print(f"Received unexpected data from C++: {data}")
        except Exception as e:
            print(f"Error in receive_message_cpp: {e}")
            
if __name__ == "__main__":
    try:        
        print("Starting receive thread")
        receive_thread = threading.Thread(target=receive_message)
        
        receive_thread.start()
        receive_thread.join()
    except KeyboardInterrupt:
        print("Manual program interruption")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        print("Closing sockets and stopping threads")
        stop_threads.set()  # Signal threads to stop
        receive_sock_cpp.close()
        send_sock_js.close()
        print("Sockets closed and threads stopped.")
