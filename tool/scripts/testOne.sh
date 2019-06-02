#!/bin/bash

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
ledger-live proxy -f apdu.snapshot.log $opt &
PID=$!
rm -rf output/ dbdata/
if [ "$opt" == "-u" ]; then
  rm -rf expected/
fi
mkdir output

echo "Running test $name..."
export DISABLE_TRANSACTION_BROADCAST=1
export DEVICE_PROXY_URL=ws://localhost:8435
source ./test.sh
echo "done."
sleep 2
if kill -0 $PID 2> /dev/null; then
  curl -XPOST http://localhost:8435/end
fi
wait
if [ "$opt" == "-u" ]; then
  mkdir -p expected
  cp ./output/* ./expected/
fi
if [ -d "./expected" ]; then
  diff ./output ./expected
  if [ $? -ne 0 ]; then
    echo "Unexpected result."
    exit 1
  fi
fi
echo
