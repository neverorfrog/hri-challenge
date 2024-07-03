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
            
            self.save_controlled_robot_pose(debug_packet)
            self.save_obstacles(debug_packet)
            
            controlled_robot_pos_x = self.debuginfo.controlledRobotPosX.get_last_elem()
            controlled_robot_pos_y = self.debuginfo.controlledRobotPosY.get_last_elem()
            self.send_robot_pose(controlled_robot_pos_x, controlled_robot_pos_y, PlotId.ControlledRobot)
            
            
            autonomous_robot_pos_x = self.debuginfo.autonomousRobotPosX.get_last_elem() + controlled_robot_pos_x
            autonomous_robot_pos_y = self.debuginfo.autonomousRobotPosY.get_last_elem() + controlled_robot_pos_y
            self.send_robot_pose(autonomous_robot_pos_x, autonomous_robot_pos_y, PlotId.AutonomousRobot)
            
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
    
    def save_controlled_robot_pose(self, debug_packet) -> None:
        pos_x = debug_packet[DataEntryIndex.PosX.value]
        pos_y = debug_packet[DataEntryIndex.PosY.value]
        theta = debug_packet[DataEntryIndex.Theta.value]
        self.debuginfo.controlledRobotPosX.append(pos_x)
        self.debuginfo.controlledRobotPosY.append(pos_y)
        self.debuginfo.controlledRobotTheta.append(theta)
        
    def save_obstacles(self, debug_packet) -> None:
        #extract x and y positions of obstacles
        index = DataEntryIndex.ObstacleCenterX.value
        obstacle_x_pos = debug_packet[index:index+self.config.MAX_OBSTACLES]
        index = DataEntryIndex.ObstacleCenterY.value
        obstacle_y_pos = debug_packet[index:index+self.config.MAX_OBSTACLES]
        
        #extract types of obstacles
        index = DataEntryIndex.ObstacleTypes.value
        obstacles_types = debug_packet[index:index+self.config.MAX_OBSTACLES]
        
        obstacle_size = debug_packet[DataEntryIndex.CurrentObstacleSize.value]
        for i in range(obstacle_size):
            if obstacles_types[i] == ObstacleType.Teammate.value:
                self.debuginfo.autonomousRobotPosX.append(obstacle_x_pos[i])
                self.debuginfo.autonomousRobotPosY.append(obstacle_y_pos[i])
        
    def send_robot_pose(self, pos_x, pos_y, plot_id: PlotId) -> None:
        robot_pose = f"{plot_id.value},{0.},{pos_x},{pos_y}"
        robot_pose_message = f"|robotPos:{robot_pose}"
        self.send_sock_js.sendto(robot_pose_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
        
    def send_ball_info(self, debug_packet) -> None:
        ballpos_x = debug_packet[DataEntryIndex.BallPosX.value]
        ballpos_y = debug_packet[DataEntryIndex.BallPosY.value]
        ball_position = f"{ballpos_x:.2f},{ballpos_y:.2f}"
        print("BallPos: ", ball_position)
        ball_position_message = f"|ballPos:{ball_position}"
        self.send_sock_js.sendto(ball_position_message.encode(), (self.config.UDP_IP_JS, self.config.UDP_SEND_PORT_JS))
        
    def send_game_info(self, debug_packet) -> None:
        time_left = debug_packet[DataEntryIndex.SecsRemaining.value]
        print("Time left: ", time_left)
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