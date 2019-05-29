#!/bin/bash
set +e
c="Bitcoin"
amount="0.0001"
feePerByte="2"

echo "Opening ${c} wallet app..."
ledger-live app -o "$c"

function getFeesTransaction {
    while read derivationMode; do
        read index
        read freshAddress
        # Send to nativeSegwit, Segwit, Legacy, invalid
        for recipient in "bc1qexdgyeu0pf8xv5wjl3h4x8t6jze8ld59nut3l2" "34N7XoKANmM66ZQDyQf2j8hPaTo6v5X8eA" "13CpyBt4mXRPz9cVda4dABNrNA47EhBe32" "bc1qexdgyeu0pf8xv5wjl3h4x8t6jz9nutInvalid"; do
            # Using following values for fees
            for fee in "0" "3" "12"; do
                echo -n $freshAddress "-> ${recipient} with fee=${fee} "
                ledger-live feesForTransaction --device -c "${c}" -s "${derivationMode}" -i "${index}" --amount "${amount}" --feePerByte "${feePerByte}" --recipient
            done
        done     
    done
}
cat ../sync_${c}/expected/1/fields.json | jq -r '.derivationMode,.index,.freshAddress' | getFeesTransaction 2>&1 | tee output/transactionFees.txt
echo "Closing ${c} wallet app ..."
ledger-live app -q