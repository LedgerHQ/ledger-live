# `logic.ts`
Set of helpers for the whole coin-evm module.

## Methods

#### getGasLimit
Helper return the gas limit of a transaction, either customized by the user or the default one.

#### getEstimatedFees
Combines the gas limit and the gas price of a transaction to return the estimated maximum fee  payed for its execution.

#### getDefaultFeeUnit
Helper to get the currency unit to use for the fee estimated fee

#### getAdditionalLayer2Fees
Some Layer 2 require additional fee in order to execute a transaction, not limiting the spending to its `gasLimit`. As of today, it's only the case for Layer 2 implementing the [OP Stack](https://stack.optimism.io/) standard and therefore behaving like Optimism.
This method is responsible for providing that additional fee in an agnostic manner.

#### mergeSubAccounts
Helper working with the idea of maintaining the javascript memory references of `SubAccounts` if there is no changes between 2 versions.

#### getSyncHash
Method creating a hash that will help triggering or not a full synchronization on an account.
Modifying the result of this method will force every ledger live account to do at least 1 full synchronization the next time they use this lib.

#### padHexString
Add necessary "0" in a hexadecimal string in order to make its character an even number, which can be necessary to some implementations. (e.g. 0x123 => 0x0123)

#### getMessageProperties
Function returning the properties that will be displayed on the nano in order to sign it, based on the message type/standard.
