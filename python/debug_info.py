from enums import ObstacleType
from ringbuffer import RingBuffer, RingBuffer
import numpy as np

W = 10 # window size
N = 2 # number of nearest robots
O = 2 # number of opponents
T = 1 # number of teammates

class DebugInfo:
    
    def __init__(self):
        self.controlled_robot : RingBuffer = RingBuffer(W, shape=(3,))
        
        self.autonomous_robot = RingBuffer(W, shape=(3,))
        
        self.ball = RingBuffer(W, shape=(2,))
        
        self.opponents = RingBuffer(W, shape=(O, 3))
        self.num_seen_opponents = RingBuffer(W, shape=())
        
        self.teammates = RingBuffer(W, shape=(T, 3))
        self.num_seen_teammates = RingBuffer(W, shape=())
        
        self.nearest_robots = RingBuffer(W, shape=(N, 3))
        
        self.debug_messages = list()
        
    def save_controlled_robot_pose(self, pos_x: float, pos_y: float, theta: float) -> None:
        self.controlled_robot.append(np.array([pos_x, pos_y, theta]))
        
    def save_obstacle_positions(self, obstacle_size: int, obstacle_x_pos: list, obstacle_y_pos: list, obstacles_types: list) -> None:
        current_me = self.controlled_robot.get_current()
        current_teammates = RingBuffer(T, shape=(3,))
        current_opponents = RingBuffer(O, shape=(3,))
        distances = np.full((obstacle_size,), np.inf)
        current_robots = RingBuffer(obstacle_size, shape=(3,))
        current_num_seen_teammates = 0
        current_num_seen_opponents = 0
        
        for i in range(obstacle_size):
            obstacle_pos = np.array([obstacle_x_pos[i], obstacle_y_pos[i], 0])
            isRobot  = False
            
            if obstacles_types[i] == ObstacleType.Teammate.value:
                current_teammates.append(obstacle_pos)
                current_num_seen_teammates += 1
                isRobot = True
                
            if obstacles_types[i] == ObstacleType.Opponent.value:
                current_opponents.append(obstacle_pos)
                current_num_seen_opponents += 1
                isRobot = True
            
            if isRobot:
                distances[i] = (np.sqrt((current_me[0] - obstacle_pos[0])**2 + (current_me[1] - obstacle_pos[1])**2))
                current_robots.append(obstacle_pos)

        self.teammates.append(current_teammates.data)
        self.opponents.append(current_opponents.data)
        self.num_seen_teammates.append(current_num_seen_teammates)
        self.num_seen_opponents.append(current_num_seen_opponents)
        
        sorted_indices = np.argsort(distances.data)
        nearest_robots = RingBuffer(N, shape=(3,))
        
        # save the N nearest robots
        if len(sorted_indices) >= N:
            for i in range(N):
                nearest_robots.append(current_robots[sorted_indices[i],:])