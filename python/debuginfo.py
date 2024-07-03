from util import RingBuffer

W = 10 # window size
N = 2 # number of nearest robots

class DebugInfo:
    
    def __init__(self):
        self.controlledRobotPosX : RingBuffer = RingBuffer(W)
        self.controlledRobotPosY : RingBuffer = RingBuffer(W)
        self.controlledRobotTheta : RingBuffer = RingBuffer(W)
        
        self.autonomousRobotPosX : RingBuffer = RingBuffer(W)
        self.autonomousRobotPosY : RingBuffer = RingBuffer(W)
        
        self.ballPosX : RingBuffer = RingBuffer(W)
        self.ballPosY : RingBuffer = RingBuffer(W)
        
        self.nearestRobotsPosX: RingBuffer = RingBuffer(N)
        self.nearestRobotsPosY: RingBuffer = RingBuffer(N)