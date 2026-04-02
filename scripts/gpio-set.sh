#!/bin/bash

# Verwendung: ./gpio-set.sh <pin> <on|off>
PIN=$1
STATE=$2

if [ -z "$PIN" ] || [ -z "$STATE" ]; then
    echo "Verwendung: $0 <pin> <on|off>"
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
    echo "Ungültiger Status: $STATE (erwartet: on oder off)"
    exit 1
fi

if command -v raspi-gpio > /dev/null; then
    # Für ältere Raspberry Pi OS Versionen
    raspi-gpio set $PIN op pn $RASPI_VAL
elif command -v gpioset > /dev/null; then
    # Für neuere Raspberry Pi OS Versionen (libgpiod)
    gpioset 0 $PIN=$VAL
else
    # Legacy sysfs approach
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction
    echo $VAL > /sys/class/gpio/gpio$PIN/value
fi

echo "GPIO $PIN auf $STATE gesetzt"
