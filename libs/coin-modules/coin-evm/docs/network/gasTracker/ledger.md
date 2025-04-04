# `ledger.ts`

This module consists of functions responsible for retrieving data related to gas pricing using the [Ledger explorers](https://explorers.api.live.ledger.com/blockchain/v4/eth/docs/#/default/getBlockchainV4EthGastrackerBarometer).

### Constants

#### explorerIdGasTrackerMap
This map is utilized to associate an explorer ID/currency with a set of properties of the gas tracker linked to it, such as its compatibility with [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) or not.

### Methods

#### getGasOptions
This method is responsible for providing three options for gas pricing: slow, medium, and fast.