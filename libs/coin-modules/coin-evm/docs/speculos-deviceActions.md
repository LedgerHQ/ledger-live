# `speculos-deviceActions.ts`

`speculos-deviceActions.ts` is a standard file required by the `ledger-live-bot` in order to verify a transaction flow on a Ledger Nano (through the `speculos` emulator)

### Methods

##### acceptTransaction
List of steps the [Ethereum app](https://github.com/LedgerHQ/app-ethereum "Ethereum nano app") a user will have to go through (and which buttons to click) in order to validate a transaction.
For now, listing only the coin/ERC20 steps. Supporting NFT would require other steps specific to the NFT plugins ([ERC721](https://github.com/LedgerHQ/app-ethereum/tree/develop/src_plugins/erc721 "ERC721")/[ERC1155](https://github.com/LedgerHQ/app-ethereum/tree/develop/src_plugins/erc1155 "ERC1155")) of the nano app.