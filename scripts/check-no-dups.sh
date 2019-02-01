#!/bin/bash

yarn-deduplicate -l | grep \@ledgerhq

if [ $? -eq 0 ]; then
  echo "Found duplicates in @ledgerhq/* – fix it with yarn-deduplicate"
  exit 1
fi
