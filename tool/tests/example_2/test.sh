#!/bin/bash

ledger-live send --device -c bitcoin -i 0 --self-transaction -f json |
    jq 'del(.operation.date)' > output/raw.json

