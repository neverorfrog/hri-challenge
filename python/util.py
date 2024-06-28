import yaml
from omegaconf import OmegaConf
from enum import Enum

def load_config(file_path):
    with open(file_path, 'r') as file:
        try:
            data = yaml.safe_load(file)
            config = OmegaConf.create(data)
            return config
        except yaml.YAMLError as e:
            print(f"Error decoding YAML: {e}")
            
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
    Padding = 14