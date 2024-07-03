import numpy as np

class RingBuffer():
    
    def __init__(self, size: int, shape: tuple) -> None:
        self.size: int = size
        self.data = np.zeros(shape=(size, *shape), dtype=np.float32)
        self.index: int = 0
    
    def append(self, elem) -> None:
        self.data[self.index] = elem
        self.index = (self.index + 1) % self.size
    
    def get_current(self) -> np.ndarray:
        if self.index == 0:
            return self.__getitem__(self.size - 1).squeeze()
        return self.__getitem__(self.index - 1).squeeze()

    def __getitem__(self, index) -> np.ndarray:
        return self.data[index]  
    
    def __str__(self):
        return str(self.data)
    
    def __setitem__(self, index, value):
        self.data[index] = value
        
    def __len__(self):
        return self.size
    
    def __iter__(self):
        return iter(self.data)
    
    @property
    def shape(self):
        return self.data.shape
    
    
if __name__ == "__main__":
    buffer = RingBuffer(5, (3,))
    print(buffer)
    print(buffer.shape)
    
    elem = np.zeros((3,))
    elem[0] = 1
    elem[1] = 2
    elem[2] = 3
    
    buffer.append(elem)
    print(buffer)
    print(buffer[0])
    print(buffer[0].shape)
    
    buffer[1] = np.array([4, 5, 6])
    print(buffer[1])
    
    floatbuffer = RingBuffer(5, ())
    print(floatbuffer.shape)
    floatbuffer.append(1.0)
    print(floatbuffer)
    print(floatbuffer[0])
    