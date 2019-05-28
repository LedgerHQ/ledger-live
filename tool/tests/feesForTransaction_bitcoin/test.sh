#!/bin/bash

c="bitcoin"
amount="0.0001"
feePerByte="2"

ledger-live app -o "$c"

function getFeesTransaction {
    while read derivationMode; do
        read index
        read freshAddress
        echo -n $freshAddress "- "
        ledger-live feesForTransaction --device -c "${c}" -s "${derivationMode}" -i "${index}" --amount "${amount}" --feePerByte "${feePerByte}" --self-transaction
     done
}
cat ../sync_Bitcoin/expected/1/fields.json | jq -r '.derivationMode,.index,.freshAddress' | getFeesTransaction > output/transactionFees.txt