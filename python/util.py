import yaml
from omegaconf import OmegaConf

def load_config(file_path):
    with open(file_path, 'r') as file:
        try:
            data = yaml.safe_load(file)
            config = OmegaConf.create(data)
            return config
        except yaml.YAMLError as e:
            print(f"Error decoding YAML: {e}")
