import socket
import struct
from omegaconf import OmegaConf
from enums import DataEntryIndex, PlotId, ObstacleType
from debug_info import DebugInfo
import numpy as np
from socket_thread import SocketThread

class DebugInfoReceiver(SocketThread):
    def __init__(self, config: OmegaConf, debuginfo: DebugInfo):
        super().__init__(config)
        self.debuginfo = debuginfo
        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._server_socket.bind((config.local_ip, config.debug_receive_port))
        self._client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    @property
    def server_socket(self):
        return self._server_socket
    
    @property
    def client_socket(self):
        return self._client_socket

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
                debug_packet[x_index : x_index+self.config.max_obstacles], 
                debug_packet[y_index : y_index+self.config.max_obstacles], 
                debug_packet[types_index : types_index+self.config.max_obstacles]
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
                    current_opponents[i,0], 
                    current_opponents[i,1], 
                    PlotId.Opponent.value + i 
                )
            
            self.send_ball_info(debug_packet)
            self.send_game_info(debug_packet)
            self.send_autonomous_role(debug_packet)
            
    def receive_from_cpp(self) -> struct:
        debug_packet = None
        try:    
            data, _ = self.server_socket.recvfrom(1024)
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
        self.client_socket.sendto(robot_pose_message.encode(), (self.config.local_ip, self.config.debug_send_port))
        
    def send_ball_info(self, debug_packet) -> None:
        ballpos_x = debug_packet[DataEntryIndex.BallPosX.value]
        ballpos_y = debug_packet[DataEntryIndex.BallPosY.value]
        ball_position = f"{ballpos_x:.2f},{ballpos_y:.2f}"
        ball_position_message = f"|ballPos:{ball_position}"
        self.client_socket.sendto(ball_position_message.encode(), (self.config.local_ip, self.config.debug_send_port))
        
    def send_game_info(self, debug_packet) -> None:
        time_left = debug_packet[DataEntryIndex.SecsRemaining.value]
        time_left_message = f"|timeLeft:{time_left}"
        self.client_socket.sendto(time_left_message.encode(), (self.config.local_ip, self.config.debug_send_port))

    def send_autonomous_role(self, debug_packet) -> None:
        current_me = self.debuginfo.controlled_robot.get_current()
        controlled_robot_pos_x = current_me[0]
        controlled_robot_pos_y = current_me[1]

        current_teammates = self.debuginfo.teammates.get_current()
        autonomous_robot_pos_x = current_teammates[0]
        autonomous_robot_pos_y = current_teammates[1]

        ball_pos_x = debug_packet[DataEntryIndex.BallPosX.value]
        ball_pos_y = debug_packet[DataEntryIndex.BallPosY.value]

        controlled_ball_distance = np.sqrt((controlled_robot_pos_x - ball_pos_x)**2 + (controlled_robot_pos_y - ball_pos_y)**2)
        autonomous_ball_distance = np.sqrt((autonomous_robot_pos_x - ball_pos_x)**2 + (autonomous_robot_pos_y - ball_pos_y)**2)

        autonomous_striker = autonomous_ball_distance < controlled_ball_distance

        autonomous_info = f"|autonomousRole:{autonomous_striker}"
        self.client_socket.sendto(autonomous_info.encode(), (self.config.local_ip, self.config.debug_send_port))