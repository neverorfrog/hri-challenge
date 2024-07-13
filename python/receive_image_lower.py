import socket
import numpy as np
import cv2
import os
from omegaconf import OmegaConf
from util import load_config

here = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(here, "config.yaml")
config: OmegaConf = load_config(config_path)
MY_IP = config.my_ip
port = config.lower_image_receive_port

def start_server():

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    server_socket.bind((MY_IP, port))
    
    server_socket.listen(5)
    print(f"Server in ascolto su {MY_IP}:{port}")
    
    while True:

        client_socket, addr = server_socket.accept()
        print(f"Connessione accettata da {addr}")
        
        try:

            expected_size = 320 * 240

            image_data = b""
            while len(image_data) < expected_size:
                packet = client_socket.recv(expected_size - len(image_data))
                if not packet:
                    break
                image_data += packet

            if len(image_data) != expected_size:
                print(f"Errore: dimensione dei dati ricevuti {len(image_data)} diversa dalla dimensione attesa {expected_size}")
                continue

            image_array = np.frombuffer(image_data, dtype=np.uint8).reshape((240, 320))
            cv2.imwrite("lower.jpg", image_array)
            response = "Immagine ricevuta"
            client_socket.send(response.encode('utf-8'))
        except Exception as e:
            print(f"Errore durante la comunicazione: {e}")
        finally:
            client_socket.close()

if __name__ == "__main__":
    start_server()
