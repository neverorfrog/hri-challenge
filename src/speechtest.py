import speech_recognition as sr

# obtain audio from the microphone
for index, name in enumerate(sr.Microphone.list_microphone_names()):
    print("Microphone with name \"{1}\" found for `Microphone(device_index={0})`".format(index, name))

r = sr.Recognizer()
m = sr.Microphone()

try:
    with m as source: 
        print("Listening...")
        audio = r.listen(source, timeout=5)
        print("Recognizing...")
        text = r.recognize_whisper(audio, language="english")
        print(f"Recognized Text: {text}")
except Exception as e:
    print(f"An error occurred: {e}")