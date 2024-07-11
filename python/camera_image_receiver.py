import socket
import struct
from omegaconf import OmegaConf
from socket_thread import SocketThread
import numpy as np
import cv2

class CameraImageReceiver(SocketThread):
    def __init__(self, config: OmegaConf):
        super().__init__(config)
        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._server_socket.bind((config.my_ip, config.image_receive_port))
        self._server_socket.listen(5)
        self._client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.img_size = config.width * config.height
        
    @property
    def server_socket(self):
        return self._server_socket
    
    @property
    def client_socket(self):
        return self._client_socket

    def update(self):
        while not self.stop_threads.is_set():
            self._client_socket, addr = self.server_socket.accept()
            self.receive_image()
            

    def receive_image(self) -> None:
        img_data = b""
        try:    
            
            while len(img_data) < self.img_size:
                packet = self.client_socket.recv(self.img_size - len(img_data))
                if not packet:
                    break
                img_data += packet
            
            if len(img_data) != self.img_size:
                print(f"Error: received data size {len(img_data)} different from expected size {self.img_size}")
                return
            
            img_array = np.frombuffer(img_data, dtype=np.uint8).reshape((self.config.height, self.config.width))
            cv2.imwrite("upper.jpg", img_array)
            response = "Immagine ricevuta"
            self.client_socket.send(response.encode('utf-8'))
                
        except Exception as e:
            print(f"Error in receiving the image: {e}")