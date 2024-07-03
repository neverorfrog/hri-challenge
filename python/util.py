import yaml
from omegaconf import OmegaConf
import netifaces
import numpy as np

class RingBuffer:
    def __init__(self, size: int, dtype=float):
        self.size: int = size
        self.data: np.ndarray = np.empty(shape=(size,), dtype=dtype)
        self.index: int = 0
    
    def append(self, elem):
        self.data[self.index] = elem
        self.index = (self.index + 1) % self.size
        
    def __item__(self, index):
        return self.data[index]
    
    def get_last_elem(self):
        if self.index == 0:
            return self.data[self.size - 1]
        else:
            return self.data[self.index - 1]
    
    
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