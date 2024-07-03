from enums import ObstacleType
from util import RingBuffer

W = 10 # window size
N = 2 # number of nearest robots

class DebugInfo:
    
    def __init__(self):
        self.controlled_robot_x : RingBuffer = RingBuffer(W)
        self.controlled_robot_y : RingBuffer = RingBuffer(W)
        self.controlled_robot_theta : RingBuffer = RingBuffer(W)
        
        self.autonomous_robot_x : RingBuffer = RingBuffer(W)
        self.autonomous_robot_y : RingBuffer = RingBuffer(W)
        self.autonomous_robot_theta : RingBuffer = RingBuffer(W)
        
        self.ball_x : RingBuffer = RingBuffer(W)
        self.ball_y : RingBuffer = RingBuffer(W)
        
        self.opponents_x : RingBuffer = RingBuffer(W, dtype=object)
        self.opponents_y : RingBuffer = RingBuffer(W, dtype=object)
        
        self.nearest_robots_x: RingBuffer = RingBuffer(W, dtype=object)
        self.nearest_robots_y: RingBuffer = RingBuffer(W, dtype=object)
        
    def save_controlled_robot_pose(self, pos_x: float, pos_y: float, theta: float) -> None:
        self.controlled_robot_x.append(pos_x)
        self.controlled_robot_y.append(pos_y)
        self.controlled_robot_theta.append(theta)
        
    def save_obstacle_positions(self, obstacle_size: int, obstacle_x_pos: list, obstacle_y_pos: list, obstacles_types: list) -> None:
        current_opponents_x = []
        current_opponents_y = []
        for i in range(obstacle_size):
            if obstacles_types[i] == ObstacleType.Teammate.value:
                self.autonomous_robot_x.append(obstacle_x_pos[i])
                self.autonomous_robot_y.append(obstacle_y_pos[i])
            if obstacles_types[i] == ObstacleType.Opponent.value:
                current_opponents_x.append(obstacle_x_pos[i])
                current_opponents_y.append(obstacle_y_pos[i])
        self.opponents_x.append(current_opponents_x)
        self.opponents_y.append(current_opponents_y)