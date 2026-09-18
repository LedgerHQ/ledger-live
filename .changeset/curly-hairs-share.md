---
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/live-common": minor
---

Fix broken TRC10 sends on Tron

A TRC10 transfer is crafted with the token's numeric asset id (encoded into the
TransferAssetContract `asset_name`), but the Tron family's `getAssetFromToken` returned the token's
`contractAddress` — which, for a TRC10 token from CAL, is the issuer address, not the asset id. The
crafted transfer then named a non-existent asset and the send failed. TRC10 now derives its asset
reference from the token id (`tron/trc10/<id>`), mirroring `getTokenFromAsset`; TRC20 keeps using its
contract address.
