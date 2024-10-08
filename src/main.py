from omegaconf import OmegaConf
import os
from typing import List
import threading
import subprocess

from communication.utils import SocketThread, load_config, DebugInfo
from communication.threads import CommandSender, DebugInfoReceiver, CameraImageReceiver
from communication.threads.speechtest2 import SpeechSender

def run_node_script():
    try:
        node_script_dir = os.path.join(os.path.dirname(__file__), "gui")
        # Run 'node client.js' and capture the output
        result = subprocess.run(
            ['node', 'client.js'],
            cwd=node_script_dir,
            check=True,  # Raise an exception if the command fails
            stdout=subprocess.PIPE,  # Capture standard output
            stderr=subprocess.PIPE,  # Capture standard error
            text=True  # Treat output as text instead of bytes
        )
        
        # Print the output of the Node.js script
        print("Output:", result.stdout)
        print("Error:", result.stderr)

    except subprocess.CalledProcessError as e:
        # Handle errors in executing the command
        print(f"An error occurred while running the script: {e}")
        print("Standard Output:", e.stdout)
        print("Standard Error:", e.stderr)

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(here, "config.yaml")
    config: OmegaConf = load_config(config_path)
    debuginfo = DebugInfo()
    
    command_sender = CommandSender(config)
    speech_sender = SpeechSender(config)
    debug_info_receiver = DebugInfoReceiver(config, debuginfo)
    # upper_image_receiver = CameraImageReceiver(config, "upper")
    # lower_image_receiver = CameraImageReceiver(config, "lower")
    node_thread = threading.Thread(target=run_node_script)
    threads: List[threading.Thread] = [debug_info_receiver, command_sender, node_thread, speech_sender]
    
    for thread in threads:
        thread.start()
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        for thread in threads:
            if(isinstance(thread, SocketThread)):
                thread.stop()
    finally:
        for thread in threads:
            if(isinstance(thread, SocketThread)):
                thread.stop()
    

if __name__ == "__main__":
    main()