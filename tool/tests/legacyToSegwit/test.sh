#!/bin/bash

recipientAddress=`ledger-live receive --currency 'bitcoin_testnet' --scheme 'segwit' --index 0`
echo $recipientAddress

ledger-live send --device --currency 'bitcoin_testnet' --scheme '' --index 0 --recipient $recipientAddress --amount 0.001 --feePerByte 3 --format json |
    jq 'del(.operation.date)' > output/raw.json