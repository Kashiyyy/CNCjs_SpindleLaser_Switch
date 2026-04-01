#!/usr/bin/env python3
import socketio
import RPi.GPIO as GPIO
import json
import os
import sys

# CNCjs server connection details
CNCJS_URL = "http://localhost:8000"
# You might need a token if your CNCjs is protected
CNCJS_TOKEN = os.getenv("CNCJS_TOKEN", "")

# Initialize socket.io client
sio = socketio.Client()

# Set up GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

@sio.event
def connect():
    print(f"Connected to CNCjs server at {CNCJS_URL}")

@sio.event
def disconnect():
    print("Disconnected from CNCjs server")

@sio.on('raspi:gpio:write')
def on_gpio_write(*args):
    """
    Listens for 'raspi:gpio:write' events.
    Expected arguments: pin (int), value (int/bool)
    Alternatively: {'pin': int, 'value': int/bool}
    """
    try:
        if len(args) == 2:
            pin = int(args[0])
            value = int(args[1])
        elif isinstance(args[0], dict):
            pin = int(args[0].get('pin'))
            value = int(args[0].get('value'))
        else:
            print(f"Unknown arguments received: {args}")
            return

        print(f"GPIO Write: Pin {pin} -> {value}")

        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, value)
    except Exception as e:
        print(f"Error processing GPIO write: {e}")

if __name__ == "__main__":
    try:
        # Construct the connection URL with token if provided
        connect_url = CNCJS_URL
        if CNCJS_TOKEN:
            connect_url += f"?token={CNCJS_TOKEN}"

        sio.connect(connect_url)
        sio.wait()
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        GPIO.cleanup()
