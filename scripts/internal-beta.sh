#!/bin/bash

(
  echo "build ios and upload to Testflight"
  yarn ios:internal
  echo "done with ios"
) &
pid1=$!

(
  echo "build android and upload to Google Play Store"
  yarn android:internal
  echo "done with android"
) &
pid2=$!

function cleanup {
  kill -9 "$pid1" &>/dev/null
  kill -9 "$pid2" &>/dev/null
}

trap cleanup EXIT
wait
echo "new internal betas pushed for ios and android"