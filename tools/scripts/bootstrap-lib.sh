#!/bin/bash

set -e
LIB=$1
NAME=$(basename $LIB)
if [ -e "$LIB" ] || [ "$NAME" == "" ]; then
  echo 'Usage: pnpm bootstrap-lib libs/your-new-lib'
  exit 1
fi
cp -R .LIB_TEMPLATE $LIB
cd $LIB
for f in package.json; do
    sed "s/TEMPLATE/$NAME/g" $f > TMP
    mv TMP $f
done