#!/bin/bash

# $1 is the first argument passed to the script
if [ "$1" = "a" ]; then
    echo "Activating virtual Environment"
    # Run some start command
    source myen/bin/activate
elif [ "$1" = "d" ]; then
    echo "Deactivating virtual Environment"
    # Run some stop command
    deactivate
else
    echo "Usage: $0 {a|d}"
fi