#!/bin/bash

set -e

cd ../..
PATH=$(pnpm bin):$PATH
cd -

tsc --watch &
tsc -m ES6 --outDir lib-es --watch

