
#!/usr/bin/env python3
import json,os,time,serial,RPi.GPIO as GPIO

CONFIG="/tmp/cnc_mode_config.json"
STATE="/tmp/cnc_mode_state"

GPIO.setmode(GPIO.BCM)

def load():
    try:
        return json.load(open(CONFIG))
    except:
        return {"gpio":{"pin":17},"active":{"laser":"","spindle":""},"materials":{"laser":{},"spindle":{}}}

cfg=load()
pin=cfg.get("gpio",{}).get("pin",17)

GPIO.setup(pin,GPIO.OUT)

def send(cmd):
    try:
        s=serial.Serial("/dev/ttyUSB0",115200,timeout=1)
        time.sleep(0.2)
        s.write((cmd+"\n").encode())
        s.close()
    except:
        pass

def apply(mode):
    preset=cfg.get("active",{}).get(mode)
    mat=cfg.get("materials",{}).get(mode,{}).get(preset,{})
    for k,v in mat.items():
        if k.startswith("$"):
            send(f"{k}={v}")

def toggle():
    if os.path.exists(STATE):
        mode=open(STATE).read().strip()
    else:
        mode="spindle"

    if mode=="spindle":
        mode="laser"
        GPIO.output(pin,1)
        send("$32=1")
    else:
        mode="spindle"
        GPIO.output(pin,0)
        send("$32=0")

    open(STATE,"w").write(mode)
    apply(mode)

toggle()
GPIO.cleanup()
