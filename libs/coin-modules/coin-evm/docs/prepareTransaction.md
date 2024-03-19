# `prepareTransaction.ts`

Where most of the magic comes from. 
`prepareTransaction.ts` contains a set of functions responsible for transforming a *potentially* incomplete Ledger Live transaction into a complete one. 

**⚠️ Important:** The term "complete" does not mean "valid." The purpose of the `prepareTransaction` function is to populate the various transaction fields while ensuring that it does not break even when expectable errors are encountered. It is the responsibility of the `getTransactionStatus` method to detect any incorrect logic within a transaction, such as incorrect fees, inadequate gasLimit, or excessive amounts.

## Methods

#### prepareTransaction <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
As the main entrypoint for all transactions, the function is responsible for updating the shared aspects of transactions, such as fee-related properties and then identifies the transaction type (coin, token, NFT) and dispatch it accordingly to the appropriate preparation method.
The `gasLimit` is calculated during the preparation phase by simulating the transaction. This calculation may lead to an error some circumstances like a node rejection or by a smart contract revert. In such cases, the `gasLimit` is set to `0`, and this should be detected at the `getTransactionStatus` level to return a proper error to the user.



**Important:** This method must always preserve the reference to the original *potentially* incomplete transaction passed as an argument if the preparation process does not introduce any modifications to the resulting transaction. *Because React.*

#### prepareCoinTransaction
Specific preparation for either coin transactions (sending *ETH* for example) or transactions coming from 3rd party crafter like the `Wallet API`.
These transactions can have `data` in it, but it has to be set in advance (by 3rd party crafter here) and will not be inferred nor modified.

#### prepareTokenTransaction
Specific preparation for ERC20 transfers crafted with a `TokenAccount`. 
The calldata is inferred and added to the `data` field and the `gasLimit` is calculated by creating a temporary transaction using the correct recipient (the token's smart contract) and the freshly crafted calldata will contain the recipient added by the user.
This calldata is created based on  [`transfer(address,uint256)`](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-transfer-address-uint256-) method where the parameters are respectively the recipient and the amount of tokens by the `getTransactionData` method.

#### prepareNftTransaction
Specific preparation for ERC721 & ERC1155 transfers crafted with an `Account` and a transaction mode `erc721` or `erc1155`.
The calldata is inferred and added to the `data` field and the `gasLimit` is calculated by creating a temporary transaction using the correct recipient (the NFT's smart contract) and the freshly crafted calldata will contain the recipient added by the user.
This calldata is created by the `getTransactionData` method and based on the NFT standard:
- ERC721: [`safeTransferFrom(address,address,uint256,bytes)`](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721-safeTransferFrom-address-address-uint256-bytes-) method where the parameters are respectively the owner, the recipient, the token ID and an empty buffer.
- ERC1155: [`safeTransferFrom(address,address,uint256,uint256,bytes)`](https://docs.openzeppelin.com/contracts/4.x/api/token/erc1155#IERC1155-safeTransferFrom-address-address-uint256-uint256-bytes-) method where the parameters are respectively the owner, the recipient, the token ID, the amount of NFT to transfer and an empty buffer.

#### prepareForSignOperation
Used as a final step to rectify and/or complete a Ledger Live transaction with some fields:
- Updates the recipient of smart contract transactions with the smart contract's address. 
*In Ledger Live, the `recipient` field of a transaction is always regarded as the destination to which the user intends to send coins, tokens, or NFTs. However, in the context of tokens and NFTs, the recipient should actually be the smart contract associated with the specific token or NFT, and the responsibility for transferring the tokens to the intended recipient lies within the calldata.*
*Modifying the recipient of the transaction while preparing it would mean changing the content of the content that the user is inputting. This would result in displaying a different address (the smart contract address) in the input and creating a lot of confusion. Consequently, the recipient is kept as originally typed by the user until this final step, at which point the destination address can be switched to the smart contract address if necessary*

- Updates the amount of token and NFT transactions crafted by Ledger Live and set it to `0`
*Same reasoning applies to the `amount` field of a transaction as it does to the recipient. While users typically intend to specify the quantity of tokens they want to send, it's important to note that the `amount` field always represents the amount in **wei** that is expected to be sent. That amount field is therefore always set to `0` when crafted by the Live, and the responsibility for transferring the corresponding quantity of tokens to the intended recipient lies within the calldata.* 

- Updates the account's nonce from the latest possible value returned by the node, including pending operations.

