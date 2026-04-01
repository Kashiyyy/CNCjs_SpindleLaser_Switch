#!/bin/bash

# Standard-Pin 16, falls kein Argument übergeben wurde
PIN=${1:-16}

if command -v raspi-gpio > /dev/null; then
    raspi-gpio set $PIN op pn dh
elif command -v gpioset > /dev/null; then
    # gpioset (libgpiod) ist der neue Standard
    # Wir nehmen Chip 0 an, was auf den meisten Pi's stimmt
    gpioset 0 $PIN=1
else
    # Legacy sysfs approach
    if [ ! -d /sys/class/gpio/gpio$PIN ]; then
        echo $PIN > /sys/class/gpio/export
    fi
    echo out > /sys/class/gpio/gpio$PIN/direction
    echo 1 > /sys/class/gpio/gpio$PIN/value
fi

echo "GPIO $PIN set to HIGH"
