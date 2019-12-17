#!/bin/bash

c="Ethereum"

ledger-live app -o "$c"

function getAddress {
    while read derivationMode; do
        read freshAddress
        read freshAddressPath
        echo $derivationMode
        echo $freshAddress
        ledger-live getAddress -c "${c}" --derivationMode "${derivationMode}" --path "${freshAddressPath}"
    done
}
cat ../sync_${c}/expected/1/fields.json | jq -r '.derivationMode,.freshAddress,.freshAddressPath' | getAddress > output/getAddress.json
echo "Closing ${c} wallet app ..."
ledger-live app -q