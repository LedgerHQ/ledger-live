# UTXO Picking Strategies and Bitcoin Transaction Fees

## Understanding the UTXO Model in Bitcoin Family
In the Bitcoin family of cryptocurrencies, which is based on the UTXO (Unspent Transaction Output) model, a transaction's inputs consist of UTXOs that are about to be spent, while its outputs generate new UTXOs. The sum of all inputs must be greater than or equal to the sum of the outputs, with the difference being the transaction fee paid to miners. This fee, divided by the transaction size, results in a fee rate measured in sat/vbyte. The higher this value, the more likely miners are to include the transaction in a block due to the higher fees.

## Transaction Fee Rate in Ledger Live
When users make a transfer in Ledger Live, they input the destination address and transfer amount, and then choose a transaction fee rate. This fee rate is calculated based on the current network transaction fees. Users can select from low, medium, high options, or set a custom fee rate. The backend API to query the current network's transaction fee rate is:
https://explorers.api.live.ledger.com/blockchain/v4/btc/fees
It returns data like:
```
{
    "6":34549,"4":34550,"2":36108,"last_updated":1706600551
}
```
This means, for example, to have a transaction included within 6 blocks, a user should pay a fee rate of 34549 sat/vbyte, corresponding to the low option. For inclusion within 4 blocks, the fee rate is 34550 sat/vbyte (medium), and for 2 blocks, it's 36108 sat/vbyte (high).

## UTXO Picking Strategies in Ledger Live
When constructing a transaction, Ledger Live needs to select which UTXOs to use as inputs. This automatic selection process is known as UTXO picking. Ledger Live offers three strategies for UTXO picking:
1. **Older UTXO First:** Prioritizes the older UTXOs (Implemented in `wallet-btc/DeepFirst.ts`).
2. **Smaller UTXOs First:** Prioritize using UTXOs with smaller denominations (Implemented in `wallet-btc/Merge.ts`).
3. **Automatic UTXO Selection:** Aims to minimize the transaction fee (Implemented in `wallet-btc/CoinSelect.ts`). The `CoinSelect.ts` implementation is complex, using a non-recursive implementation based on depth-first search. It traverses all UTXO combinations and selects the one with the minimum transaction fee. This process is NP-hard, and the time complexity is exponential. Therefore, the search is stopped after a certain number of steps, and the best solution found so far is selected.

The utxo picking process is implemented through the following abstract function:
```
selectUnspentUtxosToUse(
xpub: Xpub,
outputs: OutputInfo[],
feePerByte: number,
): Promise<{
unspentUtxos: Output[];
totalValue: BigNumber;
fee: number;
needChangeoutput: boolean;
}>
```
Each of the above three strategies has a different implementation of this interface. The input includes `xpub` (the user's account), `outputs` (calculated based on the destination address and transfer amount), and `feePerByte` (the chosen transaction fee rate). The interface returns an object containing the selected UTXOs, their total value, the transaction fee, and whether a change output is needed. This interface is called in the `buildTx` function (in `xpub.ts`) after the user inputs the transaction amount and destination address.

## Transaction Fee Calculation
As mentioned, the transaction fee equals the fee rate times the transaction size. We implemented the `maxTxSizeCeil` function (in `utils.ts`) to estimate the transaction's maximum size, taking inputs and outputs as inputs:
```
maxTxSizeCeil(
inputCount: number,
outputScripts: Buffer[],
includeChange: boolean,
currency: ICrypto,
derivationMode: string,
): number
```
The transaction size is determined by the transaction's currency, the sender's account derivation mode, and the inputs and outputs. The result is returned in vbytes, which differ from bytes in that only vbytes are related to transaction fees. For more details on the calculation of vbyte transaction sizes, refer to [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/questions/89385/is-there-a-difference-between-bytes-and-virtual-bytes-vbytes) and the comments in `utils.ts`.

The `maxTxSizeCeil` function is called in the `selectUnspentUtxosToUse` function during transaction construction and UTXO selection to help determine which UTXOs to use as inputs. It is also used in estimating the 'Max Spendable' amount by constructing a transaction using all the account's UTXOs with only one output, then calling `maxTxSizeCeil` to calculate the transaction size, and finally calculating the maximum transferable amount based on the transaction fee rate.

