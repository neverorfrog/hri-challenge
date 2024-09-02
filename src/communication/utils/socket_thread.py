import threading
import socket
from abc import abstractmethod, ABC

class SocketThread(threading.Thread, ABC):
    """This is an abstract class representing a socket thread.

    Attributes:
        config (dict): A dictionary containing configuration information for the socket thread.
        stop_threads (threading.Event): An event object used to signal the thread to stop.
    """

    def __init__(self, config):
        super().__init__()
        self.config = config
        self.stop_threads = threading.Event()
       
    @abstractmethod 
    def update() -> None:
        """Update method to be implemented by subclasses."""
        pass
    
    def run(self):
        try:
            thread = threading.Thread(target=self.update)
            thread.start()
            thread.join()
        except KeyboardInterrupt:
            print("Manual program interruption")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        finally:
            self.stop()
            
    def stop(self):
        self.stop_threads.set()
        self.server_socket.close()
        self.client_socket.close()
        print("Sockets closed and threads stopped.")
        
    @property
    @abstractmethod
    def server_socket(self) -> socket.socket:
        """Abstract property representing the server socket."""
        pass
    
    @property
    @abstractmethod
    def client_socket(self) -> socket.socket:
        """Abstract property representing the client socket."""
        pass