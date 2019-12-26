#!/bin/bash

GIT_REMOTE=git@github.com:LedgerHQ/ledger-live-common.git

git clean -xdf &&
git fetch $GIT_REMOTE && git checkout master &&
git pull &&
rm -rf node_modules &&
yarn &&
yalc publish &&
cd cli &&
yalc add @ledgerhq/live-common &&
yarn &&
yarn link &&
yarn build &&
mkdir -p cli/tests/tmp/ &&
ledger-live appsUpdateTestAll 2> cli/tests/tmp/error.log

LOG_FILE=cli/tests/tmp/error.log

if [ ! -f $LOG_FILE ]; then
    echo "Log file couldn't be find"
elif grep -i "NoDevice" $LOG_FILE; then
    echo "A Nano device needs to be connected"
elif grep -i -E "FAILED|ERROR" $LOG_FILE; then
    echo "An error has occured. Creating an issue..."
    node cli/tests/create-issue.js "`cat $LOG_FILE`"
else
    echo "Success. All the apps have been installed / updated / removed properly"
fi
