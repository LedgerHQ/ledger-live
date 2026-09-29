---
"@ledgerhq/live-signer-polkadot": minor
"@ledgerhq/live-common": patch
"@ledgerhq/types-live": patch
---

Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

`@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
enabled, and falls back to the legacy implementation otherwise — with the flag off, every
polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
keeps its current behaviour unchanged.
