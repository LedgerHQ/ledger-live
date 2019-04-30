#!/bin/bash

set -e
cd $(dirname $0)

targets="hw-getAddress libcore-buildOperation libcore-buildTransaction libcore-hw-signTransaction libcore-signAndBroadcast libcore-buildTokenAccounts libcore-getFeesForTransaction"

cd ../src

rm -rf generated
mkdir generated

genTarget () {
  t=$1
  echo '// @flow'
  for family in *; do
    if [ -f $family/$t.js ]; then
      echo 'import '$family' from "../families/'$family/$t'";'
    fi
  done
  echo
  echo 'export default {'
  for family in *; do
    if [ -f $family/$t.js ]; then
      echo '  '$family','
    fi
  done
  echo '};'
}

cd families
for t in $targets; do
  genTarget $t > ../generated/$t.js
done