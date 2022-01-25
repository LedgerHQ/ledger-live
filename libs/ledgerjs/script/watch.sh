#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -

export NODE_ENV=production
tsc --watch &
tsc -m ES6 --outDir lib-es --watch

