#!/bin/bash

set +e

c="Bitcoin Testnet"
amount="0.1"

echo "Opening ${c} wallet app..."
ledger-live app -o "$c"

function getFeesTransaction {
    while read derivationMode; do
        read index
        read freshAddress
        # Send to nativeSegwit, Segwit, Legacy, invalid
        for recipient in "tb1q2dzl2a48sej5c9s9qzkpa3fer6s2zsht6f3sxh" "2MtDVceeyg8hwv4regwYdFS3Vee3UWaikwq" "mkdpWGrPpNqysJJ72ye8FZ7XywJn7WCLqR" "2MtDVceeyg8hwbifuaz28J6fhdsgjOJH"; do
            # Using following values for fees
            for fee in "0" "3" "12"; do
                echo -n $freshAddress "-> ${recipient} with fee=${fee} "
                ledger-live feesForTransaction --device -c "${c}" -s "${derivationMode}" -i "${index}" --amount "${amount}" --feePerByte "${fee}" --recipient "${recipient}"
            done
        done
    done
}
cat ../sync_BitcoinTestnet/expected/1/fields.json | jq -r '.derivationMode,.index,.freshAddress' | getFeesTransaction 2>&1 | tee output/transactionFees.txt
echo "Closing ${c} wallet app ..."
ledger-live app -q