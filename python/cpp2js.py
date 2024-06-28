import socket
import struct
import threading
from omegaconf import OmegaConf
from util import load_config, DataEntryIndex
import os

here = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(here, "config.yaml")
config: OmegaConf = load_config(config_path)

# Thread control flag
stop_threads = threading.Event()

# Create socket for receiving messages from C++
receive_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
receive_sock_cpp.bind(("10.0.255.88", config.UDP_RECEIVE_PORT_CPP)) # PC IP Address
# Create socket for sending messages to JavaScript
send_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def update():
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
            if len(data) == struct.calcsize(config.data_format):
                debug_packet = struct.unpack(config.data_format, data)
                
                # Robot pose
                pos_x = debug_packet[DataEntryIndex.PosX.value]
                pos_y = debug_packet[DataEntryIndex.PosY.value]
                theta = debug_packet[DataEntryIndex.Theta.value]
                robot_number = debug_packet[DataEntryIndex.PlayerNum.value]
                print("RobotNumber: ", robot_number)
                print("Pose: ", pos_x, pos_y, theta)
                pose_controlled = f"4,{theta},{pos_x},{pos_y}"
                pose_controlled_message = f"|robotPos:{pose_controlled}"
                send_sock_js.sendto(pose_controlled_message.encode(), (config.UDP_IP_JS, config.UDP_SEND_PORT_JS))           
                
                # Ball position
                ballpos_x = debug_packet[DataEntryIndex.BallPosX.value]
                ballpos_y = debug_packet[DataEntryIndex.BallPosY.value]
                print("BallPos: ", ballpos_x, ballpos_y)
                ball_position = f"{ballpos_x},{ballpos_y}"
                ball_position_message = f"|ballPosition:{ball_position}"
                send_sock_js.sendto(ball_position_message.encode(), (config.UDP_IP_JS, config.UDP_SEND_PORT_JS))
                
            else:
                print(f"Received unexpected data from C++: {data}")
        except Exception as e:
            print(f"Error in receive_message_cpp: {e}")
            
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
        print("Closing sockets and stopping threads")
        stop_threads.set()  # Signal threads to stop
        receive_sock_cpp.close()
        send_sock_js.close()
        print("Sockets closed and threads stopped.")
