### NFT Support

To add a blockchain, you need to modify:

- NFT_CURRENCIES in live-env (CryptoCurrencyId)
- Add it to the Blockchain enum in ./src/supported.ts
- Add the new entry to SUPPORTED_BLOCKCHAINS_LIVE
- If the currencyId is different between LL and SimpleHash, add it to replacements with the corresponding value

⚠️ When adding a new blockchain, **be careful** with the NFT Gallery on LLM:

Ensure that the filters still work properly
