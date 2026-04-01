#!/bin/bash

# Standard-Pin 16, falls kein Argument übergeben wurde
PIN=${1:-16}

if command -v raspi-gpio > /dev/null; then
    raspi-gpio set $PIN op pn dl
elif command -v gpioset > /dev/null; then
    gpioset 0 $PIN=0
else
    # Legacy sysfs approach
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction
    echo 0 > /sys/class/gpio/gpio$PIN/value
fi

echo "GPIO $PIN set to LOW"
