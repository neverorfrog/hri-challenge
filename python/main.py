from omegaconf import OmegaConf
from socket_thread import SocketThread
from util import load_config
import os
from command_sender import CommandSender
from debug_info_receiver import DebugInfoReceiver
from camera_image_receiver import CameraImageReceiver
from debug_info import DebugInfo
from typing import List


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(here, "config.yaml")
    config: OmegaConf = load_config(config_path)
    debuginfo = DebugInfo()
    
    command_sender = CommandSender(config)
    debug_info_receiver = DebugInfoReceiver(config, debuginfo)
    camera_image_receiver = CameraImageReceiver(config)
    threads: List[SocketThread] = [command_sender, debug_info_receiver, camera_image_receiver]
    for thread in threads:
        thread.start()
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        for thread in threads:
            thread.stop()
    finally:
        for thread in threads:
            thread.stop()
    

if __name__ == "__main__":
    main()