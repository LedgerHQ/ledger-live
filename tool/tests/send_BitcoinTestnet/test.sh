#!/bin/bash

c="Bitcoin Testnet"
amount="0.1"

echo "Opening ${c} wallet app..."
ledger-live app -o "$c"


function sendFunds {
    ledger-live send --xpub ${senderXpub} --amount 0.1 --feePerByte 2 --recipient 
}

function getReceiveAddress {
    ledger-live receive --xpub ${recipientXpub} -s 
}