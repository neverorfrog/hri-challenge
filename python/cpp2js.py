import socket
import struct
import threading
from omegaconf import OmegaConf
from util import DataEntryIndex

class Cpp2Js(threading.Thread):
    def __init__(self, config: OmegaConf):
        super().__init__()
        self.config = config
        self.stop_threads = threading.Event()
        self.receive_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.receive_sock_cpp.bind((config.MY_IP, config.UDP_RECEIVE_PORT_CPP))
        self.send_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def update(self):
        """
        RECEIVES messages from C++ and sends them to a JavaScript server.

        This function continuously receives data from a C++ socket and processes it. 
        It unpacks the received data and sends specific messages to a JavaScript server 
        using different UDP ports. It also calculates and updates the positions of 
        autonomous and controlled robots.

        Raises:
            Exception: If there is an error in receiving or processing the data.

        """
        while not self.stop_threads.is_set():
            debug_packet = self.receive_from_cpp()

            # Robot pose
            pos_x = debug_packet[DataEntryIndex.PosX.value]
            pos_y = debug_packet[DataEntryIndex.PosY.value]
            theta = debug_packet[DataEntryIndex.Theta.value]
            robot_number = debug_packet[DataEntryIndex.PlayerNum.value]
            print("RobotNumber: ", robot_number)
            pose_controlled = f"3,{theta:.2f},{pos_x:.2f},{pos_y:.2f}"
            print(f"Pose: {pose_controlled}")
            pose_controlled_message = f"|robotPos:{pose_controlled}"
            self.send_sock_js.sendto(pose_controlled_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))

            # Ball position
            ballpos_x = debug_packet[DataEntryIndex.BallPosX.value]
            ballpos_y = debug_packet[DataEntryIndex.BallPosY.value]
            ball_position = f"{ballpos_x:.2f},{ballpos_y:.2f}"
            print(f"BallPos: {ball_position}")
            ball_position_message = f"|ballPos:{ball_position}"
            self.send_sock_js.sendto(ball_position_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
            
            # Time left
            time_left = debug_packet[DataEntryIndex.SecsRemaining.value]
            print("Time left: ", time_left)
            time_left_message = f"|timeLeft:{time_left}"
            self.send_sock_js.sendto(time_left_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
            
            # Obstacles
            index = DataEntryIndex.ObstacleTypes.value
            obstacle_size = debug_packet[DataEntryIndex.CurrentObstacleSize.value]
            obstacles_types = debug_packet[index:index+6] # TODO hardcodato
            index = DataEntryIndex.ObstacleCenters.value
            obstacle_positions = debug_packet[index:index+12]
            print("Number of obstacles: ", obstacle_size)
            print("Obstacle types: ", obstacles_types)
            print("Obstacle positions: ", obstacle_positions)

                
    def receive_from_cpp(self) -> struct:
        debug_packet = None
        try:    
            data, addr = self.receive_sock_cpp.recvfrom(1024)
        except Exception as e:
            print(f"Error in receiving the message: {e}")
        if len(data) == struct.calcsize(self.config.data_format):
            debug_packet = struct.unpack(self.config.data_format, data)
        else:
            print(f"Received unexpected data from C++: {data}")
        return debug_packet

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
        self.receive_sock_cpp.close()
        self.send_sock_js.close()
        print("Sockets closed and threads stopped.")