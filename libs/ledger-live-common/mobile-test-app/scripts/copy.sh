#!/bin/bash

set -e
cd $(dirname $0)/..
rm -rf ledger/live-common
rm -rf ledger/all-test.js
cp -R ../src/ ledger/live-common

cd ledger

# patch
mv live-common/__tests__ live-common/tests_folder
rm live-common/libcore/platforms/nodejs.js
#######

for f in `find . -name '*.libcore.js'`; do
  echo 'import "'$f'";'
done > all-test.js
