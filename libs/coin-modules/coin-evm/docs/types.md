# `types`

## Files

#### editTransaction
Set of types proper to the functionality of the replace by fee mechanism.

#### etherscan
Set of types proper to etherscan explorers. Mostly containing their own transaction format, received from their API. Also used for Blockscout explorers and any other explorer having a compatiblity layer with Etherscan.

#### ledger
Set of types proper to ledger explorers. Mostly containing their own transaction format, received from their API.

#### signer
Set of types for the abstraction added to remove the dependency of the `coin-evm` module with the `@ledgerhq/hw-app-eth` module (as a dependency, not devDependency which is necessary for some types). Mostly used in the bridge definition with the `buildSignOperation` & `makeAccountBridgeReceive` methods.

#### transaction
Set of types representing the `evm` family transactions, specific to Ledger Live and/or the `@ledgerhq/coin-framework`