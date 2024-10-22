from enum import Enum

class Command(Enum):
    Null = 0
    GoToPosition = 1
    Dribble = 2
    GoToBallAndDribble = 3
    Kick = 4
    Spazza = 5
    Pass = 6
    AskForTheBall = 7
    Turn = 8
    SearchTheBall = 9
    Stop = 10
    LookAtTheBall = 11
    LookForward = 12
    LookLeft = 13
    LookRight = 14
    Scan = 15
    
class Strategy(Enum):
    Default = 0
    Passaggi = 1
    Difesa = 2
      
class DataEntryIndex(Enum):
    Suca = 0
    Header = 1
    Version = 2
    PlayerNum = 3
    TeamNum = 4
    Fallen = 5
    PosX = 6
    PosY = 7
    Theta = 8
    BallAge = 9
    BallPosX = 10
    BallPosY = 11
    NumDataBytes = 12
    PlayerRole = 13
    CurrentObstacleSize = 14
    ObstacleTypes = 15
    ObstacleCenterX = 35
    ObstacleCenterY = 55
    ObstacleLastSeen = 75
    MessageBudget = 95
    SecsRemaining = 96
    ArmContact = 97
    ArmContactPos = 99
    ArmTimeOfLastContact = 101
    Suca2 = 103
    TeamBall = 104
    TeamBallVel = 106
    Suca3 = 108
    
class ObstacleType(Enum):
    Nothing = -1
    Goalpost = 0
    Unknown = 1
    SomeRobot = 2
    Opponent = 3
    Teammate = 4
    FallenSomeRobot = 5
    FallenOpponent = 6
    FallenTeammate = 7
    
class PlotId(Enum):
    AutonomousRobot = 1
    ControlledRobot = 2
    Opponent = 3
    
class CameraType(Enum):
    Upper = "upper"
    Lower = "lower"