#!/bin/bash

set -e

c="$1"
echo "$c start Sync..."
ledger-live app -o "$c"
APP_VERSION=`ledger-live deviceAppVersion`

mkdir output/1
ledger-live sync --device --currency "$c" -f json > output/tmp
cat output/tmp | jq 'del(.lastSyncDate,.blockHeight,.operations)' > output/1/fields.json
cat output/tmp | jq '.operations | sort_by(.id)[] | del(.date)' > output/1/operations.json
rm output/tmp

# a second sync to test everything is stable
echo second sync

mkdir output/2
ledger-live sync -c "$c" --file output/1/fields.json -f json > output/tmp
cat output/tmp | jq 'del(.lastSyncDate,.blockHeight,.operations)' > output/2/fields.json
cat output/tmp | jq '.operations | sort_by(.id)[] | del(.date)' > output/2/operations.json
rm output/tmp

diff ./output/1 ./output/2
if [ $? -ne 0 ]; then
  echo "A second sync don't produce same result!"
  exit 1
fi

# delete sqlite to see if a sync can restore itself
echo restoration sync
rm -rf sqlite

mkdir output/3
ledger-live sync -c "$c" --file output/1/fields.json -f json > output/tmp
cat output/tmp | jq 'del(.lastSyncDate,.blockHeight,.operations)' > output/3/fields.json
cat output/tmp | jq '.operations | sort_by(.id)[] | del(.date)' > output/3/operations.json
rm output/tmp

diff ./output/1 ./output/3
if [ $? -ne 0 ]; then
  rm -rf output_2/
  echo "A sync after a libcore deletion didn't restore same sync result!"
  exit 1
fi

rm -rf output/2/ output/3/

echo $APP_VERSION > output/app.json

echo "Closing $c wallet app..."
ledger-live app -q
echo "$c Sync SUCCESS"