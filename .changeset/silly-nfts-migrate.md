---
"@ledgerhq/live-common": minor
---

Drive EVM NFT activation from the `supportedTokens` config field instead of `isNFTActive` and the `showNfts` boolean. `EvmConfig.showNfts` is replaced by `supportedTokens: ("erc721" | "erc1155")[]`, so each NFT standard is enabled independently, and coin-evm no longer depends on `@ledgerhq/ledger-wallet-framework/nft`. Activation is checked via explicit standard membership (`supportedTokens.includes("erc721" | "erc1155")`).
