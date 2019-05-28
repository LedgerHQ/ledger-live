#!/bin/bash

c="bitcoin"

ledger-live app -o "$c"

function getAddress {
    while read derivationMode; do
        read freshAddress
        read freshAddressPath
        echo $derivationMode
        echo $freshAddress
        if [ $derivationMode != "segwit" ]
        then
            ledger-live getAddress -c "${c}" --derivationMode ' ' --path "${freshAddressPath}"
        else 
            ledger-live getAddress -c "${c}" --derivationMode "${derivationMode}" --path "${freshAddressPath}"
        fi
    done
}
cat ../sync_Bitcoin/expected/1/fields.json | jq -r '.derivationMode,.freshAddress,.freshAddressPath' | getAddress > output/getAddress.json