#!/bin/bash

set -e

export NODE_ENV=production

cd ../..
PATH=$(pnpm bin):$PATH
cd -

tsc && tsc -m ES6 --outDir lib-es
