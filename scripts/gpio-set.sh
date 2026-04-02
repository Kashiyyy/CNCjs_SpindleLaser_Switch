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
    PINCTRL_VAL="op"
elif [ "$STATE" == "off" ]; then
    VAL=0
    RASPI_VAL="dl"
    PINCTRL_VAL="ip" # oder op dl
else
    echo "Ungültiger Status: $STATE (erwartet: on oder off)"
    exit 1
fi

# 1. Versuche pinctrl (empfohlen für neuere Pi OS / Pi 5)
if command -v pinctrl > /dev/null; then
    if [ "$STATE" == "on" ]; then
        pinctrl set $PIN op dh
    else
        pinctrl set $PIN op dl
    fi
# 2. Versuche raspi-gpio (älterer Standard)
elif command -v raspi-gpio > /dev/null; then
    raspi-gpio set $PIN op pn $RASPI_VAL
# 3. Versuche gpioset (libgpiod) - Mit Fallback für Chip-Erkennung
elif command -v gpioset > /dev/null; then
    # In Trixie / libgpiod v2 hat sich die Syntax geändert.
    # Wir versuchen die neue Syntax zuerst, dann die alte.
    # --mode=wait ist oft nötig damit der Pegel gehalten wird, aber wir nehmen an der Kern hält ihn.
    if gpioset --version | grep -q "v2"; then
        # Neue Syntax (libgpiod v2)
        gpioset pinctrl $PIN=$VAL
    else
        # Alte Syntax (libgpiod v1)
        # Wir suchen nach dem passenden Chip
        CHIP=$(gpiofind "GPIO$PIN" | cut -d' ' -f1)
        if [ -z "$CHIP" ]; then CHIP="0"; fi
        gpioset $CHIP $PIN=$VAL
    fi
# 4. Legacy sysfs
else
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction
    echo $VAL > /sys/class/gpio/gpio$PIN/value
fi

echo "GPIO $PIN auf $STATE gesetzt"
