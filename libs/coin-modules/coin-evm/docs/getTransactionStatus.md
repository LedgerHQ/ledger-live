# `getTransactionStatus.ts`
Set of function in charge of validating the different aspects of a transaction. Every transaction should pass through those methods in order to get a set of potential errors & warnings to prevent getting errors later on in a transaction flow.

## Methods

#### validateRecipient
Function validating the address set as the recipient of a transaction. It should ensure that the address is valid and as much as possible supports [EIP-55](https://eips.ethereum.org/EIPS/eip-55).
Definition of an ethereum address:
> Most generally, this represents an externally owned account (EOA) or contract account that can receive (destination address) or send (source address) transactions on the blockchain. More specifically, it is the rightmost 160 bits of a Keccak hash of an ECDSA public key.
> © [ethereum.org](https://ethereum.org/en/glossary/#section-a)

#### validateAmount
Function validating the amount of a transaction. Transactions should always have an amount and that amount should never be higher than the account is capable of using.


#### validateGas
Function in charge of validation all gas related properties of a transaction, like the gasLimit and the gas price associated to it, either as `gasPrice` or `maxFeePerGas` & `maxPriorityPerGas`.
**Important note**: This method should be responsible of informing the UI client that a transaction has a **0** `gasLimit`, which would mean the transaction failed to be simulated by the `prepareTransaction` method previously on. If the transaction should be signed and broadcasted nonetheless, the user should be inputing manually the `customGasLimit` to use.

#### validateNft
Function in charge of validating the `nft` property of a transaction, mostly verifying that the account in charge of signing the transaction does own this NFT in its potential quantity.

#### validateFeeRatio
Function in charge of detecting inconsistency in fees, like having a fee specifically high compared to the amount sent.

#### getTransactionStatus <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
Default method in charge of running all the specified functions to validate all aspects of a transaction.

#### validateEditTransaction
 Validate an edited transaction and returns related errors and warnings and akes sure the updated fees are at least 10% higher than the original fees. This 10% value isn't defined in the protocol, it's just how most nodes & miners implement it.
 If the new transaction fees are less than 10% higher than the original fees, the transaction will be rejected by the network with a "replacement transaction underpriced" error.

 #### getEditTransactionStatus
 Specific method used in the edit transaction frontend modals used to update the status of an edited transaction.