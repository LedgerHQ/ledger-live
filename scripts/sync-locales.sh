#!/bin/bash
set -e

lokalise --token $LOKALISE_TOKEN export $LOKALISE_PROJECT_ID --type json  --bundle_structure '%LANG_ISO%.json' --unzip_to src/locales/
cd src/locales
for f in *.json; do
  id=${f%.*};
  echo "exports.$id = { common: require(\"./$f\") };"
done 1> index.js
