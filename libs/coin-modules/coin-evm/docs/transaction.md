# `transaction.ts`

`transaction.ts` contains a set of helpers related to transactions in general. Some of these are standards, such as the serializers that are exported by default.

## Contants

##### DEFAULT_GAS_LIMIT
The default value of `gasLimit` for a transaction. This represents the minimum amount of gas used by a coin transaction. 
For Layer 1 coin transactions (transactions of coins without involving smart contracts), the `gasLimit` should not exceed this value. :tw-26a0: However, for Layer 2 transactions, it may not hold true as some Layer 2 solutions require payment for data availability. This means you have to pay for both L2 fees and the settlement of the rollup on L1, and this can be accomplished through gas or additional fees.


## Methods

##### formatTransaction <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
This method formats a transaction into a human-readable string for the `@ledgerhq/live-cli`.

##### fromTransactionRaw <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
This serializer transforms a stringified transaction into a hydrated transaction.

##### toTransactionRaw <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
This serializer transforms a stringified transaction into a hydrated transaction.

##### getTransactionData
This method returns the *callData* of a smart contract transaction when crafted with a transaction mode (`send` mode can be coins or ERC20 transactions, while `erc721` & `erc1155` modes are NFT transactions).

##### getTypedTransaction
[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718 "eip-2718") defines the capacity of a transaction to have different types, which can introduce new properties compared to the legacy definition. This method acts as a type guard for a transaction, depending on its type, to ensure that you're interacting with a transaction that has all the necessary properties for the [RLP encoding](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/ "RLP encoding") to work correctly. As of today, only type 0 (legacy) and type 2 ([EIP-1559](https://eips.ethereum.org/EIPS/eip-1559 "EIP-1559")) transactions are supported. Type 1 ([EIP-2930](https://eips.ethereum.org/EIPS/eip-2930 "EIP-2930")) is compatible but does not add any access lists.


##### getSerializedTransaction
This method returns an [RLP encoding](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/ "RLP encoding") hexadecimal string representation of the provided transaction.
