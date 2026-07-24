---
"@ledgerhq/coin-tron": patch
"@ledgerhq/live-common": patch
---

Integrate Tron tokens (TRC10/TRC20) into the generic coin framework so the same flows work through both the legacy bridge and the generic bridge:

- Add a Tron family bridge API (`getTokenFromAsset`, `getAssetFromToken`, `computeIntentType`) and register it, so the generic framework can build token sub-accounts and craft token transfer intents.
- Surface the token `assetOwner` from `getBalance` and the per-operation `ledgerOpType` from the TronGrid operation adapter, so token balances and operations attach to their sub-account.
- Broadcast the generic-framework signed transaction as a byte-preserving full-transaction hex (`/wallet/broadcasthex`) instead of re-decoding `raw_data`, which was lossy for `TransferAssetContract` (TRC10) and `TriggerSmartContract` (TRC20).
- Implement `validateIntent` and `getNextSequence` in the Tron coin-module API and add Tron native send support to the generic coin framework default transaction.
