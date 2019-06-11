#!/bin/bash

#!/bin/bash

(
  echo "build ios and deploy to waldo"
  yarn ios:waldo
  echo "done with ios"
) &
pid1=$!

(
  echo "build android and deploy to waldo"
  yarn android:waldo
  echo "done with android"
) &
pid2=$!

function cleanup {
  kill -9 "$pid1" &>/dev/null
  kill -9 "$pid2" &>/dev/null
}

trap cleanup EXIT
wait
echo "new android and ios versions deployed to waldo"