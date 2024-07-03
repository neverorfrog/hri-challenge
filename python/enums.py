from enum import Enum

class Command(Enum):
    Null = 0
    Dribble = 1
    GoToBallAndDribble = 2
    KickTheBall = 3
    PassTheBall = 4
    GoToPosition = 5
    AskForBall = 6
    Spazza = 7
    Turn = 8
    SearchBall = 9
    Stop = 10
    LookLeft = 11
    LookRight = 12
    Scan = 13
    LookTheBall = 14
    
class Strategy(Enum):
    Default = 0
    Passaggi = 1
    Boh1 = 2
    Boh2 = 3
      
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
    PlayerRole = 12
    NumDataBytes = 13
    CurrentObstacleSize = 14
    ObstacleTypes = 15
    ObstacleCenterX = 24
    ObstacleCenterY = 30
    MessageBudget = 36
    SecsRemaining = 37
    
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