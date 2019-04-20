#!/bin/bash

set -e

name=$1
if [ "$name" == "" ]; then
  echo "Usage: yarn createTest <name>"
  exit 1
fi

cd $(dirname $0)/../tests

if [ -x "$name" ]; then
  echo "test $name already exists"
  exit 1
fi

cp -R ../scripts/test.template $name