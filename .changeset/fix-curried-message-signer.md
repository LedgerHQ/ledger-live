---
"@ledgerhq/live-common": patch
---

Fix `messageSigner.signMessage` for casper, filecoin, internet_computer, stacks and ton families. They were exporting a curried `(signerContext) => MessageSignerFn` instead of the un-curried `SignMessage` required by `FamilySetup`, which would throw `TypeError` at runtime when invoked through `hw/signMessage`. Now wrapped with `createMessageSigner(createSigner, signMessage)` matching the evm/solana pattern. Vechain is unchanged (handled separately).
