#!/bin/bash

set -e

c="bitcoin"

ledger-live app -o "$c"
cat ../sync_Bitcoin/expected/1/fields.json | jq '.derivationMode,.freshAddress,.freshAddressPath' | while read derivationMode; do read freshAddress; read freshAddressPath; ledger-live getAddress -c "$c" --derivationMode "$derivationMode" --path "$freshAddressPath"; done > output/address.json