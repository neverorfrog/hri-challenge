import os
import queue
import sounddevice as sd
import vosk
import json
import socket
import struct


from communication.utils import Command, SocketThread, load_config
from omegaconf import OmegaConf



class MicrophoneStream(object):
    def __init__(self, rate, chunk):
        self._rate = rate
        self._chunk = chunk

        self._buff = queue.Queue()
        self._closed = True

    def __enter__(self):
        self._audio_stream = sd.InputStream(
            samplerate=self._rate,
            blocksize=self._chunk,
            dtype='int16',
            channels=1,
            callback=self._fill_buffer
        )
        self._audio_stream.start()
        self._closed = False
        return self

    def __exit__(self, type, value, traceback):
        self._audio_stream.stop()
        self._audio_stream.close()
        self._closed = True
        self._buff.put(None)

    def _fill_buffer(self, in_data, frames, time, status):
        self._buff.put(in_data.copy())

    def generator(self):
        while not self._closed:
            chunk = self._buff.get()
            if chunk is None:
                return
            data = [chunk]

            while True:
                try:
                    chunk = self._buff.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break

            yield b"".join(data)


class SpeechSender(SocketThread):
    def __init__(self, config):
        super().__init__(config)
        # speech sender
        self._client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        

    def listen_print_loop(self):
        # Audio recording parameters
        device_info = sd.query_devices(kind='input')
        sample_rate = device_info['default_samplerate']
        RATE = sample_rate
        CHUNK = int(RATE / 10)  # 100ms

        model = vosk.Model("/home/flavio/Scaricati/vosk-model-small-en-us-0.15")
        recognizer = vosk.KaldiRecognizer(model, RATE)

        with MicrophoneStream(RATE, CHUNK) as stream:
            audio_generator = stream.generator()
            command = None
            for content in audio_generator:
                if recognizer.AcceptWaveform(content):
                    result = recognizer.Result()
                    text = json.loads(result).get('text', '')
                    print(f"Transcript: {text}")
                    match text:
                        case "go to ball and dribble":
                            command = "GoToBallAndDribble"
                        case "spazza":
                            command = "Spazza"
                        case "pass":
                            command = "Pass"
                        case "ask":
                            command = "AskForTheBall"
                        
                        case "score":
                            command = "SearchTheBall"
                        case "stop":
                            command = "Stop"
                        case "look at the ball":
                            command = "LookAtTheBall"
                        case "look forward":
                            command = "LookForward"
                        case "look left":
                            command = "LookLeft"
                        case "look right":
                            command = "LookRight"
                        case "scan":
                            command = "Scan"
                        
                    if command is not None:
                        encoded_data = ("speech_header" + "|" + "taskType:2," + "noSelection,"+\
                                        command + "," + "1," + text + "," + "0").encode()
                        try:
                            self.client_socket.sendto(encoded_data, (self.config.robot_ip, self.config.command_receive_port))
                            print(f"Sending message to Command sender: {encoded_data}")
                        except Exception as e:
                            print(f"Error in send_message: {e}")

                else:
                    partial_result = recognizer.PartialResult()
                    partial_text = json.loads(partial_result).get('partial', '')
                    print(f"Partial Transcript: {partial_text}")

                command = None

    def update(self):
        self.listen_print_loop()

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(here, "config.yaml")
    config: OmegaConf = load_config(config_path)
    
    speech_sender = SpeechSender(config)
    speech_sender.update()
if __name__ == "__main__":
    main()
    
# https://alphacephei.com/vosk/models