import yaml
from omegaconf import OmegaConf
import netifaces
    
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