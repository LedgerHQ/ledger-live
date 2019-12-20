#!/bin/bash

cd ~/Dev/ledger-live-common &&
git clean -xdf &&
git fetch Arnaud && git checkout device-appsUpdateTestAll &&
git pull Arnaud device-appsUpdateTestAll &&
rm -rf node_modules &&
yarn &&
yalc publish &&
cd cli &&
yalc add @ledgerhq/live-common &&
yarn &&
yarn link &&
yarn build &&
ledger-live appsUpdateTestAll