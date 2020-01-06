#!/bin/bash

set -e
cd $(dirname $0)/../tests

MINIMAL_MODE=$MINIMAL # can be overriden
if [ "master" != "$CIRCLE_BRANCH" ]; then
  MINIMAL_MODE=1
fi

MANDATORY_TESTS=
OPTIONAL_TESTS=
for td in *; do
  if [ -f ./$td/test.sh ]; then
    if [ -f ./$td/mandatory ]; then
      MANDATORY_TESTS="$MANDATORY_TESTS $td"
    else
      OPTIONAL_TESTS="$OPTIONAL_TESTS $td"
    fi
  fi
done

for td in $MANDATORY_TESTS; do
  bash $PWD/../scripts/testOne.sh $td $1
done

if [ ! $MINIMAL_MODE ]; then
  for td in $OPTIONAL_TESTS; do
    bash $PWD/../scripts/testOne.sh $td $1
  done
fi

