# `logic.ts`
Set of helpers for the whole coin-evm module.

## Methods

#### legacyTransactionHasFees
Simple function to verify the presence of key and values specific to transactions of type 0 and 1 (not type 2 / EIP-1559).

#### eip1559TransactionHasFees
Simple function to verify the presence of key and values specific to transactions of type 2 (not type 0/Legacy or type 1/EIP-2930).

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

#### attachOperations
 Helper in charge of linking operations together based on transaction hash. Token operations & NFT operations are the result of a coin operation and if this coin operation is originated by our user we want to link those operations together as main & children operations.
 A sub operation should always be linked to a coin operation, even if the user isn't at the origin of the sub operation. "NONE" type coin operations can be added when necessary.
 ⚠️ If an NFT operation was found without a coin parent operation just like if it was not initiated by the synced account and we were to find that coin operation during another sync, the NONE operation created would not be removed, creating a duplicate that will cause issues regarding NFT balances & React key duplications.
 
#### isNftTransaction
Type gard method narrowing NFT related transactions.

#### padHexString
Add necessary "0" in a hexadecimal string in order to make its character an even number, which can be necessary to some implementations. (e.g. 0x123 => 0x0123)

#### getMessageProperties
Function returning the properties that will be displayed on the nano in order to sign it, based on the message type/standard.