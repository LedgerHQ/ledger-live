#!/bin/bash

dataLength=`cat data.json | jq '. | length'`
data=`cat data.json | jq '.'`

echo "Opening Zcash wallet app ..."
ledger-live app -o zcash

for((i=0; i<$dataLength; i++))
do
    currency=`echo $data | jq -r --argjson id $i '.[$id].currency'`
    echo $currency
    indexSender=`echo $data | jq -r --argjson id $i '.[$id].indexSender'`
    amount=`echo $data | jq -r --argjson id $i '.[$id].amount'`
    fees=`echo $data | jq -r --argjson id $i '.[$id].fees'`
    type=`echo $data | jq -r --argjson id $i '.[$id].type'`
    recipientAddress=`echo $data | jq -r --argjson id $i '.[$id].recipientAddress'`
    type=`echo $data | jq -r --argjson id $i '.[$id].type'`

    echo "Sending $currency $type..."
    ledger-live send --device --currency $currency --index $indexSender --recipient $recipientAddress --amount $amount --feePerByte $feePerByte --format json |
        jq 'del(.operation.date)' > output/${currency}_$type.json
    sleep 2
done
ledger-live app -q