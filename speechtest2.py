import os
import queue
import sounddevice as sd
import vosk
import json

# Audio recording parameters
RATE = 16000
CHUNK = int(RATE / 10)  # 100ms

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

def listen_print_loop():
    model = vosk.Model("path/to/your/vosk-model")
    recognizer = vosk.KaldiRecognizer(model, RATE)

    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_generator = stream.generator()
        for content in audio_generator:
            if recognizer.AcceptWaveform(content):
                result = recognizer.Result()
                text = json.loads(result).get('text', '')
                print(f"Transcript: {text}")
            else:
                partial_result = recognizer.PartialResult()
                partial_text = json.loads(partial_result).get('partial', '')
                print(f"Partial Transcript: {partial_text}")

def main():
    listen_print_loop()

if __name__ == "__main__":
    main()
    
# https://alphacephei.com/vosk/models