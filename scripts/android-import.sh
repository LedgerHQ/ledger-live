#!/bin/bash

OVERRIDE=$1
adb shell am force-stop "com.ledger.live";
adb shell am start -n "com.ledger.live/.MainActivity" --es "importDataString" $OVERRIDE -t "text/plain"
