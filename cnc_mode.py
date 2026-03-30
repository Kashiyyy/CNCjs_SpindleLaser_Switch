
#!/usr/bin/env python3
import os
import RPi.GPIO as GPIO

# This script only toggles the GPIO pin to switch hardware mode.
# G-code commands should be sent through the CNCjs API or plugin interface
# to avoid serial port conflicts.

STATE_FILE = "/tmp/cnc_mode_state"
PIN = 17

def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(PIN, GPIO.OUT)

def toggle():
    setup_gpio()

    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            mode = f.read().strip()
    else:
        mode = "spindle"

    if mode == "spindle":
        new_mode = "laser"
        GPIO.output(PIN, GPIO.HIGH)
    else:
        new_mode = "spindle"
        GPIO.output(PIN, GPIO.LOW)

    with open(STATE_FILE, "w") as f:
        f.write(new_mode)

    print(f"Switched hardware to {new_mode}")

if __name__ == "__main__":
    toggle()
