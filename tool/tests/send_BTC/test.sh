#!/bin/bash

dataLength=`cat data.json | jq '. | length'`
data=`cat data.json | jq '.'`

for((i=-1; i<$dataLength; i++))
do
    currency=`echo $data | jq -r --argjson id $i '.[$id].currency'`
    echo $currency
    scheme=`echo $data | jq -r --argjson id $i '.[$id].scheme'`
    index=`echo $data | jq -r --argjson id $i '.[$id].index'`
    amount=`echo $data | jq -r --argjson id $i '.[$id].amount'`
    fees=`echo $data | jq -r --argjson id $i '.[$id].fees'`
    recipient=`echo $data | jq -r --argjson id $i '.[$id].recipient'`
    type=`echo $data | jq -r --argjson id $i '.[$id].type'`

    echo "Sending $currency $type ..."

    ledger-live send --device --currency $currency --scheme $scheme --index $index --recipient $recipient --amount $amount --feePerByte $feePerByte --format json |
    jq 'del(.operation.date)' > output/${currency}_$type.json
    sleep 2
done