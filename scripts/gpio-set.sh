#!/bin/bash

# Verwendung: ./gpio-set.sh <pin> <on|off>
PIN=$1
STATE=$2

# Logge in die Konsole (wird von der Node.js Bridge/PM2 aufgefangen)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Aufruf: $0 $PIN $STATE (User: $(whoami))"

if [ -z "$PIN" ] || [ -z "$STATE" ]; then
    echo "FEHLER: Fehlende Argumente. Verwendung: $0 <pin> <on|off>"
    exit 1
fi

# Bestimme den Wert (1 für on, 0 für off)
if [ "$STATE" == "on" ]; then
    VAL=1
    RASPI_VAL="dh"
elif [ "$STATE" == "off" ]; then
    VAL=0
    RASPI_VAL="dl"
else
    echo "FEHLER: Ungültiger Status: $STATE"
    exit 1
fi

# 1. Versuche pinctrl (empfohlen für neuere Pi OS / Pi 5)
if command -v pinctrl > /dev/null; then
    if [ "$STATE" == "on" ]; then
        pinctrl set $PIN op dh
    else
        pinctrl set $PIN op dl
    fi
    SUCCESS=$?
# 2. Versuche raspi-gpio
elif command -v raspi-gpio > /dev/null; then
    raspi-gpio set $PIN op pn $RASPI_VAL
    SUCCESS=$?
# 3. Versuche gpioset (libgpiod)
elif command -v gpioset > /dev/null; then
    if gpioset --version | grep -q "v2"; then
        gpioset pinctrl $PIN=$VAL
    else
        CHIP=$(gpiofind "GPIO$PIN" | cut -d' ' -f1)
        [ -z "$CHIP" ] && CHIP="0"
        gpioset $CHIP $PIN=$VAL
    fi
    SUCCESS=$?
# 4. Legacy sysfs
else
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction
    echo $VAL > /sys/class/gpio/gpio$PIN/value
    SUCCESS=$?
fi

if [ $SUCCESS -eq 0 ]; then
    echo "Erfolg: GPIO $PIN auf $STATE gesetzt"
else
    echo "FEHLER: Setzen von GPIO $PIN auf $STATE fehlgeschlagen (Code: $SUCCESS)"
    exit $SUCCESS
fi
