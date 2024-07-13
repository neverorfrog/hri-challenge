import socket
import threading
from omegaconf import OmegaConf
from enums import CameraType
import numpy as np
import cv2

class CameraImageReceiver(threading.Thread):
    def __init__(self, config: OmegaConf, camera: CameraType):
        super().__init__()
        self.stop_threads = threading.Event()
        self.camera = camera
        self.config = config
        if self.camera == CameraType.Upper:
            self.img_height = config.upper_image_height
            self.img_width = config.upper_image_width
        else:
            self.img_height = config.lower_image_height
            self.img_width = config.lower_image_width
        self.img_size = self.img_height * self.img_width
        
        
    def update(self):
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind((self.config.my_ip, self.config.upper_image_receive_port))
        server_socket.listen(5)
        while not self.stop_threads.is_set():
            client_socket, addr = server_socket.accept()
            print(f"Connessione accettata da {addr}")
            if addr[0] == self.config.robot_ip:
                self.receive_image(client_socket)
                
    def run(self):
        try:
            thread = threading.Thread(target=self.update)
            thread.start()
            thread.join()
        except KeyboardInterrupt:
            print("Manual program interruption")
            

    def receive_image(self, client_socket) -> None:
        img_data = b""
        try:    
            while len(img_data) < self.img_size:
                packet = client_socket.recv(self.img_size - len(img_data))
                if not packet:
                    break
                img_data += packet
            
            if len(img_data) != self.img_size:
                print(f"Error: received data size {len(img_data)} different from expected size {self.img_size}")
                return
            
            img_array = np.frombuffer(img_data, dtype=np.uint8).reshape((self.img_height, self.img_width))
            cv2.imwrite(f"{self.camera.value}.jpg", img_array)
                
        except Exception as e:
            print(f"Error in receiving the image: {e}")