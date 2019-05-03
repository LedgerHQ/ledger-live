#!/bin/bash

set -e
cd $(dirname $0)/../tests


for td in *; do
  if [ -f ./$td/test.sh ]; then
    bash $PWD/../scripts/testOne.sh $td $1
  fi
done
