#!/bin/bash


cat input/account_partial.json | ledger-live sync --file - -f json > output/raw.json
cat output/raw.json | jq 'del(.lastSyncDate,.blockHeight,.operations)' > output/accountFields.json
cat output/raw.json | jq '.operations | sort_by(.id)[] | del(.date)' > output/operations.json
rm output/raw.json