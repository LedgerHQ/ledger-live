# `signOperation.ts`

`signOperation.ts` contains the necessary logic for the signature step of an already complete and valid transaction.

## Methods

#### applyEIP155

[EIP-155](https://eips.ethereum.org/EIPS/eip-155 "EIP-155") is a standard designed to mitigate replay attacks across various EVM chains by altering the `v` value within the ECDSA signature of a transaction. While the `@ledgerhq/hw-app-eth` library already tries to implement this modification, its result is unstable, therefore, the `applyEIP155` helper function has been created to reapply the EIP depending on the outcome of the Ethereum app binding.

#### buildSignOperation `factory of [standard]`

This observable is responsible for applying the last set of transformations to a Ledger Live transaction. These transformations include things such as updating the recipient address, particularly when dealing with ERC20/721/1155 transactions crafted by Ledger Live itself, or applying the correct nonce.
Once done, it initiates the communication with the Nano Ethereum app through the `@ledgerhq/hw-app-eth` library to contextualize (`resolveTransaction`) and sign the transaction. Once the signature is received, it applies the EIP-155 standard to the transaction before returning it for broadcasting. 
Additionally, it builds an `optimisticOperation`, which acts as a placeholder in the account operations history. This placeholder will await for the confirmation (or not) of the actual transaction on the blockchain which will then replaced it after a new synchronization.