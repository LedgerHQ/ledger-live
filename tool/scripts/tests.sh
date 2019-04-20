#!/bin/bash

set -e
cd $(dirname $0)/../tests


for td in *; do
  bash $PWD/../scripts/testOne.sh $td $1
done
