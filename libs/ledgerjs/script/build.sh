#!/bin/bash

set -e

export NODE_ENV=production
tsc && tsc -m ES6 --outDir lib-es
