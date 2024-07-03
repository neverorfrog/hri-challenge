import socket
import struct
import threading
from omegaconf import OmegaConf
from enums import DataEntryIndex, PlotId, ObstacleType
from debuginfo import DebugInfo

class Cpp2Js(threading.Thread):
    def __init__(self, config: OmegaConf, debuginfo: DebugInfo):
        super().__init__()
        self.config = config
        self.debuginfo = debuginfo
        self.stop_threads = threading.Event()
        self.receive_sock_cpp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.receive_sock_cpp.bind((config.MY_IP, config.UDP_RECEIVE_PORT_CPP))
        self.send_sock_js = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def update(self):
        """
        RECEIVES messages from C++ and sends them to a JavaScript server.

        This function continuously receives data from a C++ socket and processes it. 
        It unpacks the received data and sends specific messages to a JavaScript server 
        using different UDP ports.
        """
        while not self.stop_threads.is_set():
            debug_packet = self.receive_from_cpp()
            
            self.debuginfo.save_controlled_robot_pose(
                debug_packet[DataEntryIndex.PosX.value], 
                debug_packet[DataEntryIndex.PosY.value], 
                debug_packet[DataEntryIndex.Theta.value]
            )
            
            x_index = DataEntryIndex.ObstacleCenterX.value
            y_index = DataEntryIndex.ObstacleCenterY.value
            types_index = DataEntryIndex.ObstacleTypes.value
            self.debuginfo.save_obstacle_positions(
                debug_packet[DataEntryIndex.CurrentObstacleSize.value], 
                debug_packet[x_index : x_index+self.config.MAX_OBSTACLES], 
                debug_packet[y_index : y_index+self.config.MAX_OBSTACLES], 
                debug_packet[types_index : types_index+self.config.MAX_OBSTACLES]
            )
            
            current_me = self.debuginfo.controlled_robot.get_current()
            self.send_robot_pose(
                current_me[0], 
                current_me[1], 
                PlotId.ControlledRobot.value
            )
            
            current_teammates = self.debuginfo.teammates.get_current()
            self.send_robot_pose(
                current_teammates[0], 
                current_teammates[1], 
                PlotId.AutonomousRobot.value
            )
            
            current_opponents = self.debuginfo.opponents.get_current()
            for i in range(len(current_opponents)):
                self.send_robot_pose(
                    current_opponents[i], 
                    current_opponents[i], 
                    PlotId.Opponent.value + i 
                )
            
            self.send_ball_info(debug_packet)
            self.send_game_info(debug_packet)
            
    def receive_from_cpp(self) -> struct:
        debug_packet = None
        try:    
            data, _ = self.receive_sock_cpp.recvfrom(1024)
        except Exception as e:
            print(f"Error in receiving the message: {e}")
        if len(data) == struct.calcsize(self.config.data_format):
            debug_packet = struct.unpack(self.config.data_format, data)
        else:
            print(f"Received unexpected data from C++: {data}")
        return debug_packet
        
        
    def send_robot_pose(self, pos_x, pos_y, plot_id: int) -> None:
        robot_pose = f"{plot_id},{0.},{pos_x},{pos_y}"
        robot_pose_message = f"|robotPos:{robot_pose}"
        self.send_sock_js.sendto(robot_pose_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
        
    def send_ball_info(self, debug_packet) -> None:
        ballpos_x = debug_packet[DataEntryIndex.BallPosX.value]
        ballpos_y = debug_packet[DataEntryIndex.BallPosY.value]
        ball_position = f"{ballpos_x:.2f},{ballpos_y:.2f}"
        ball_position_message = f"|ballPos:{ball_position}"
        self.send_sock_js.sendto(ball_position_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
        
    def send_game_info(self, debug_packet) -> None:
        time_left = debug_packet[DataEntryIndex.SecsRemaining.value]
        time_left_message = f"|timeLeft:{time_left}"
        self.send_sock_js.sendto(time_left_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))

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