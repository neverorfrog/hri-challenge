from communication.threads.receive_image_upper import start_server
from omegaconf import OmegaConf
import os
from communication.utils import load_config

here = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(here, "config.yaml")
config: OmegaConf = load_config(config_path)

if __name__ == "__main__":
    start_server(config)