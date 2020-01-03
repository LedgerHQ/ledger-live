#!/bin/bash
set -e

cd targets
for f in */; do
  cd $f
  echo "SETUP TARGET $f"
  yarn
  cd -
done
cd ..
