#!/bin/bash

set -e
cd $(dirname $0)/..
rm -rf ledger/tests
cp -R ../cli/src/__tests__ ledger/tests
cd ledger/tests
for f in *.js; do
  if [ "$f" != "index.js" ]; then
    echo 'import "./'$f'";'
  fi
done > index.js
