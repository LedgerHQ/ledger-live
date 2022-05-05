# Tezos integration

## Status

This coin integration is being reworked from a C++ in-house implementation into a JavaScript integration.

## Environment

Here is a quick summary of how this integration is made:

- Taquito library
- Ledger's self hosted tzkt.io API
- Ledger's own node

## Account ID, public key and addresses

The account id have the shape `{impl}:{version}:{currency}:{pubkey}:{derivation}`

For instance: `js:2:tezos:02e9d3749ffd715be88b9bc9f1afd0470e66b867042d2862c61f335a76e4d37af0:tezbox`

The public key is the account main identifier, expressed as uncompress hex: `02e9d3749ffd715be88b9bc9f1afd0470e66b867042d2862c61f335a76e4d37af0`.

This public key is needed for making transaction and also is used to hash the account address. (`tz1PTxfn1fge2tJwGGpW9zNuYf6BseM3GJXt` in this case)

The Account type as defined in https://github.com/LedgerHQ/ledger-live-common/blob/develop/docs/account.md will be used with:
- `.id` to be the id explained as above
- `.xpub` to be the public key
- `.freshAddress` to be the tezos account address