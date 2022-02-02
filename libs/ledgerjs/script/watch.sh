#!/bin/bash

set -e

export NODE_ENV=production
tsc --watch &
tsc -m ES6 --outDir lib-es --watch

