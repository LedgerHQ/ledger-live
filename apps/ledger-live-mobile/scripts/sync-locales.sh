#!/bin/bash
set -e

cd src/locales
echo "/* THIS FILE IS GENERATED, DO NOT EDIT */" > index.js
for lang in *; do
  if [ -d $lang ]; then
    echo -n "exports.$lang = { ";
    cd $lang
    for f in *.json; do
      name=${f%.*};
      echo -n "$name: require(\"./$lang/$f\"), "
    done
    cd - > /dev/null
    echo "};"
  fi
done 1> index.js
