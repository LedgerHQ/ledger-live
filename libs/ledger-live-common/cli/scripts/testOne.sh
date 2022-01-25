#!/bin/bash

START_TIME=$SECONDS

# all verbose logs are logs to stdout but not recorded by testOne.
export VERBOSE_FILE=`mktemp`

name=$1
shift
opt=$@
cwd=`dirname $0`

# ledger-live () {
#  $cwd/../cli.js "$@"
# }

set -e
cd $(dirname $0)/../tests/$name

touch apdu.snapshot.log
curl -XPOST http://localhost:8435/end 2> /dev/null || true # make sure all is killed
ledger-live proxy -f apdu.snapshot.log $opt >> $VERBOSE_FILE &
PID=$!
rm -rf output/ dbdata/
if [ "$opt" == "--record" ]; then
  rm -rf expected/
fi
mkdir output

echo "Running test $name..."
export DISABLE_TRANSACTION_BROADCAST=1
export DEVICE_PROXY_URL=ws://localhost:8435

set +e
source ./test.sh
time=$(($SECONDS - $START_TIME))
if [ $? -eq 0 ]; then
  echo "$name: done in ${time}s."
else
  echo "--- recent logs ---"
  tail $VERBOSE_FILE
  echo "$name: FAILED."
  exit 1
fi
set -e

sleep 2

if kill -0 $PID 2> /dev/null; then
  curl -XPOST http://localhost:8435/end
fi
wait
if [ "$opt" == "--record" ]; then
  mkdir -p expected
  cp -r ./output/* ./expected/
fi
if [ -d "./expected" ]; then
  diff ./output ./expected
  if [ $? -ne 0 ]; then
    echo "$name: Unexpected result."
    echo "--- recent logs ---"
    tail $VERBOSE_FILE
    echo "$name: FAILED."
    exit 1
  fi
fi
echo
