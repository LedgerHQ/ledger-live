#!/bin/bash

git clean -xdf &&
git fetch upstream && git checkout master &&
git pull &&
rm -rf node_modules &&
yarn &&
yalc publish &&
cd cli &&
yalc add @ledgerhq/live-common &&
yarn &&
yarn link &&
yarn build &&
ledger-live appsUpdateTestAll 2> tests/tmp/error.log

if grep "FAILED" .tests/tmp/error.log; then
    echo "An error has occured"
    curl -i -H 'Authorization: token 6fd7ff181cd04c8d9ba780945ac52a0fc06e0b69' \
-d '{"title": "device appsUpdateTestAll failed", "body":"An error has occured during the process. Find logs enclosed"}' \
https://api.github.com/repos/Arnaud97234/ledger-live-common/issues
else
    echo "Success. All the app have been installed / updated / removed properly"
fi
