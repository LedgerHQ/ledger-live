# Tezos integration

## Status

This coin integration is being reworked from a C++ in-house implementation into a JavaScript integration.

## Environment

Here is a quick summary of how this integration is made:

- Taquito library
- Ledger's self hosted tzkt.io API
- Ledger's own node

## Account ID, public key and addresses

The account id have the shape `{impl}:{version}:{currency}:{address}:{derivation}`

For instance: `js:2:tezos:tz1UPWKtm7n7q76jFcXPdUcfTTdAUMnFiuDm:tezbox`

The address is the account main identifier: `tz1UPWKtm7n7q76jFcXPdUcfTTdAUMnFiuDm`.

This address is used for all blockchain API calls (balance, operations, etc.) and is derived from the public key.

## Generic Bridge (Alpaca)

Tezos now uses the generic bridge (Alpaca) implementation. The Account structure is defined by the generic bridge's `getAccountShape` function.

See: [jsHelpers.ts](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-framework/src/bridge/jsHelpers.ts) and `libs/ledger-live-common/src/bridge/generic-alpaca/getAccountShape.ts`

The generic bridge handles account synchronization, transaction preparation, signing, and broadcasting through a unified interface that leverages the Tezos coin module API.
