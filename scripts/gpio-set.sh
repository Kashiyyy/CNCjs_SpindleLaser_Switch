#!/bin/bash

# Verwendung: ./gpio-set.sh <pin> <on|off>
PIN=$1
STATE=$2
LOGFILE="/home/pi/scripts/gpio.log"

# Erstelle Log-Verzeichnis falls nötig
mkdir -p "$(dirname "$LOGFILE")"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOGFILE"
}

log "Aufruf: $0 $PIN $STATE (User: $(whoami))"

if [ -z "$PIN" ] || [ -z "$STATE" ]; then
    log "FEHLER: Fehlende Argumente. Verwendung: $0 <pin> <on|off>"
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
    log "FEHLER: Ungültiger Status: $STATE"
    exit 1
fi

# 1. Versuche pinctrl (empfohlen für neuere Pi OS / Pi 5)
if command -v pinctrl > /dev/null; then
    log "Verwende pinctrl..."
    if [ "$STATE" == "on" ]; then
        pinctrl set $PIN op dh 2>> "$LOGFILE"
    else
        pinctrl set $PIN op dl 2>> "$LOGFILE"
    fi
    SUCCESS=$?
# 2. Versuche raspi-gpio
elif command -v raspi-gpio > /dev/null; then
    log "Verwende raspi-gpio..."
    raspi-gpio set $PIN op pn $RASPI_VAL 2>> "$LOGFILE"
    SUCCESS=$?
# 3. Versuche gpioset (libgpiod)
elif command -v gpioset > /dev/null; then
    log "Verwende gpioset..."
    if gpioset --version | grep -q "v2"; then
        gpioset pinctrl $PIN=$VAL 2>> "$LOGFILE"
    else
        CHIP=$(gpiofind "GPIO$PIN" | cut -d' ' -f1)
        [ -z "$CHIP" ] && CHIP="0"
        gpioset $CHIP $PIN=$VAL 2>> "$LOGFILE"
    fi
    SUCCESS=$?
# 4. Legacy sysfs
else
    log "Verwende sysfs..."
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export 2>> "$LOGFILE"
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction 2>> "$LOGFILE"
    echo $VAL > /sys/class/gpio/gpio$PIN/value 2>> "$LOGFILE"
    SUCCESS=$?
fi

if [ $SUCCESS -eq 0 ]; then
    log "Erfolg: GPIO $PIN auf $STATE gesetzt"
else
    log "FEHLER: Setzen von GPIO $PIN auf $STATE fehlgeschlagen (Code: $SUCCESS)"
fi
