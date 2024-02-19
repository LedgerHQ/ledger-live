# Bitcoin family Troubleshooting Guide

## Introduction
This guide provides steps for troubleshooting the UTXO (Unspent Transaction Output) model issues in cryptocurrency systems like Bitcoin and Dogecoin.

## Common Issues

### Error 1: "Missing Input" on Transaction Broadcast or Incorrect Balance of an account

#### Description
Occurs when broadcasting a transaction, the backend returns a "missing input" error, or account balances reported by QA or customer success are incorrect.

#### Cause
Mostly due to UTXO calculation errors, using already spent UTXOs as inputs for new transactions.

#### Debugging Steps
1. **Find Account ID in Ledger Live:** Look for a unique ID in the account's settings page.
2. **Check `app.json` File:** This file contains all account IDs in the current Ledger Live.
3. **Bitcoin ID Components:** For Bitcoin, the ID contains a currency id(bitcoin, dogecoin...) and a xpub and a derivation mode (legacy, segwit, native_segwit, taproot). e.g. `js:2:bitcoin:xpub6C3xxFdpsuBPQegeJHvf1G6YMRkay4YJCERUmsWW3DbfcREPeEbcML7nmk79AMgcCu1YkC5CA2s1TZ5ubmVsWuEr7N97X6z2vtrpRzvQbhG:native_segwit`
4. **Retrieve Account Data:** Use CLI tool with the ID to get the account's UTXOs, transactions, and balance.

##### Example Commands
- Bitcoin (native_segwit):
```
pnpm run:cli sync --id js:2:bitcoin:xpub6C3xxFdpsuBPQegeJHvf1G6YMRkay4YJCERUmsWW3DbfcREPeEbcML7nmk79AMgcCu1YkC5CA2s1TZ5ubmVsWuEr7N97X6z2vtrpRzvQbhG:native_segwit
```
- Dogecoin (legacy):
```
pnpm run:cli sync --id js:2:dogecoin:dgub8rLBz9DzvDxQTL2JqCcwRwzdz53mYZFNim9pPNM2np5BRFaoFfsV13wkhC43ENdSXYgc2tRvztLmtW7jDjArjaqsU1xJDKAwNLpJax9c38h:
```

The CLI tool returns transactions, UTXOs for each address and the overall balance for the account.

5. **Identify problematic addresses:** Compare UTXOs/transactions against public Bitcoin explorers like [Wallet Explorer](https://www.walletexplorer.com/) or [Blockchain.com Explorer](https://www.blockchain.com/explorer) to identify problematic Bitcoin addresses for further debugging.

6. **Check backend response:** A potential issue is incorrect transactions returned by Ledger Live's REST API call to:
https://explorers.api.live.ledger.com/blockchain/v4/[coin]/address/[address]/txs?batch_size=1000&order=ascending
e.g. to fetch transactions of the bitcoin address `bc1qhspn08x9yyy2w6lqsz3re4qa2k753c0zw3wq8x`:
https://explorers.api.live.ledger.com/blockchain/v4/btc/address/bc1qhspn08x9yyy2w6lqsz3re4qa2k753c0zw3wq8x/txs?batch_size=1000&order=ascending


### Error 2: Backend Error on Transaction Broadcast

#### Description
An error occurs when Ledger Live broadcasts a transaction by calling an HTTP REST API, which places the transaction's hex in the HTTP request body. The transaction's hex can be seen in the logs.

#### Debugging Steps
1. **Manual Broadcast:** Manually call the REST API to broadcast the transaction.
Example: transaction hex: "0200000004adb06f542f75ad3677ea505215f4..."
```
curl -X POST https://explorers.api.live.ledger.com/blockchain/v4/doge/tx/send
-H "Content-Type: application/json"
-d '{ "tx": "0200000004adb06f542f75ad3677ea505215f4..." }'
```
2. **Check response error from our explorer:** If an error from step 1 is returned, further debugging can be conducted based on the error information.
3. **Decode Transaction:** Use [BlockCypher](https://live.blockcypher.com/btc/decodetx/) to decode the transaction. This allows us to see the specific details of the transaction, such as inputs, outputs, etc., enabling more in-depth debugging.

### Error 3: Sync Issues in Ledger Live

#### Description
Sync account errors in Ledger Live, indicated by UI errors. These can be due to exceptions thrown in the typescript code or errors returned by backend endpoints.

#### Debugging Steps
1. **Use Dev Tools:** Start Ledger Live Desktop with `pnpm dev:lld:debug` and check the console for errors.
2. **Inspect Backend Responses:** Look for HTTP request and response details in the network tab to find potential http errors.

### Error 4: Bridge Integration Test Failures

#### Description
Failures in `bridge.integration.test.ts` may be due to nano app updates or `hw-app-btc` modifications leading to APDU incompatibility.

#### Debugging Steps
- Update APDU datasets using:
```
pnpm run:cli generateTestScanAccounts -c [mycoin]
```
- For comprehensive details on handling bridge integration tests and APDU updates, please refer to [Ledger Developers Documentation](https://developers.ledger.com/docs/blockchain/testing#writing-bridgeintegrationtestts).

---
This guide is designed to assist in the diagnosis and resolution of common issues in bitcoin family
