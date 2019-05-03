#!/bin/bash

name=$1
opt=$2
cwd=`dirname "$(realpath $0)"`

ledger-live () {
  $cwd/../cli.js "$@"
}

set -e
cd $(dirname $0)/../tests/$name

if [ "$opt" == "-u" ]; then
  export RECORD_APDU_TO_FILE=1
fi

export DISABLE_TRANSACTION_BROADCAST=1
export DEBUG_COMM_HTTP_PROXY=ws://localhost:8435

touch apdu.snapshot.log
ledger-hw-http-proxy-devserver -f apdu.snapshot.log &
PID=$!
rm -rf output/ dbdata/
if [ "$opt" == "-u" ]; then
  rm -rf expected/
fi
mkdir output
echo "Running test $name..."
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
