#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -

export NODE_ENV=production
tsc && tsc -m ES6 --outDir lib-es

(
    cd ../../flow-support
    yarn copy
)
