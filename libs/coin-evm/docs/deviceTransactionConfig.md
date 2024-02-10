# `deviceTransactionConfig.ts`
Set of functions responsible for providing to a UI client the different texts that are displayed on the screen of the nano for a specific transaction. This can only be considered as a *best effort* as there is no way to actually predict what the nano will display, as it could differ depending on the version of the nano app on the device or on the external plugins installed on the nano (Paraswap, 1inch, etc..)

## Methods

#### inferDeviceTransactionConfigWalletApi 
Method in charge of trying to detect some basic smart contract transactions that would have been crafted outside of the live (like with the Wallet API). Those transactions can't be identified through transaction's `mode` or the use of `TokenAccounts` like if they were crafted by the Live, meaning we need to identify them with the `data` they contain. 
In order to understand what a transaction is doing, you first need to get the *selector* used in the transaction calldata, which is the first 4 bytes of the calldata's buffer. Those 4 bytes are also the first 4 bytes of a `keccak` hash of the solidity method used, including the types of each parameters.
> Example: The smart contract method I want to use is `kvnDootDoot(address recipient, uint256 amount, bool hasNiceEmoji)` in solidity, in order to use that method my `data` field should start with `0x91b694ca`. 
> In order to get this value, you'd need to get the keccak hash of that function with `keccak("kvnDootDoot(address,uint256,bool)")`, which would return `0x91b694cac6af8524931c73d8da138df317cc60d3c651e3953ff57a1e97e7cccf`, making my selector: `0x91b694ca`.

This method is then used to detect selectors of transactions that are already known and clear signed with the default ethereum nano app: 
    - transfer & approval [ERC-20](https://eips.ethereum.org/EIPS/eip-20) selectors
    - transfers & approval [ERC-721](https://eips.ethereum.org/EIPS/eip-721) selectors
    - transfers & approval [ERC-1155](https://eips.ethereum.org/EIPS/eip-1155) selectors

⚠️ **Important note**: There is a collision between the `approve` methods of ERC-20 and ERC-721 which both are `0x095ea7b3`, which can lead to multiple issues. For those specific selectors, make sure to find a way to detect that the standard of the transaction's recipient contract before doing any assumption.

#### getDeviceTransactionConfig <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
Default method in charge of returning the different screens displayed on a nano device for all kinds of transactions.