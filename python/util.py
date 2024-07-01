import yaml
from omegaconf import OmegaConf
from enum import Enum
import netifaces
            
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
    ObstacleCenters = 21
    ObstacleLeft = 33
    ObstacleRight = 45
    MessageBudget = 57
    SecsRemaining = 58
    Padding = 59
    
class ObstacleType(Enum):
    Goalpost = 0
    Unknown = 1
    SomeRobot = 2
    Opponent = 3
    Teammate = 4
    FallenSomeRobot = 5
    FallenOpponent = 6
    FallenTeammate = 7
    
def get_my_ip_address():
    ip_address = "Unable to get IP address"
    try:
        interfaces = netifaces.interfaces()
        for iface in interfaces:
            addresses = netifaces.ifaddresses(iface)
            if netifaces.AF_INET in addresses:
                for addr in addresses[netifaces.AF_INET]:
                    if 'addr' in addr and not addr['addr'].startswith('127.'):
                        ip_address = addr['addr']
                        break
    except Exception as e:
        print(f"Error: {e}")
    return ip_address


def load_config(file_path):
    with open(file_path, 'r') as file:
        try:
            data = yaml.safe_load(file)
            config = OmegaConf.create(data)
            return config
        except yaml.YAMLError as e:
            print(f"Error decoding YAML: {e}")