# `adapters`
Set of functions in charge of converting a transaction format specific to a library or a backend into a Ledger Live format or vice-versa. 

## Files

#### ethers.ts
Functions used to convert transactions for the [ethers.js v5 library](https://docs.ethers.org/v5/)

#### etherscan.ts
Functions used to convert transactions coming from the [etherscan-like explorers](https://docs.etherscan.io/api-endpoints/accounts)

#### ledger.ts
Functions used to convert transactions coming from the [Ledger explorers](https://explorers.api.live.ledger.com/blockchain/v4/eth/docs/#/address/Transactions%20by%20address)