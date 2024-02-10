# `synchronization.ts`

`synchronization.ts` manages the creation and updating process of an `Account` entity.

## Constants

##### SAFE_REORG_THRESHOLD
An arbitrary number of blocks considered secure for a fork to be deemed final. The concept of finality varies depending on the consensus algorithm. On a PoW chain, the longest fork seen is relatively short (around 7/8 blocks). On a PoS chain, finality occurs every 2 epochs (equivalent to 2 times 32 blocks), thus it should be at most 64 blocks.

| Algorithm  | Finality  | Reorgs  | Fork Choice |
| ------------ | ------------ | ------------ | ------------ |
| Nakamoto (e.g., PoW Ethereum / Bitcoin) | None | Frequent  | Longest chain |
| GASPER (e.g., PoS Ethereum) | Every 2 epochs (~12 min) | Very occasional | Chain with the strongest support after the last finalized block |
| Tendermint | Single block (~1-10s) | Never  | Only finalized blocks |
(source: [paradigm](https://www.paradigm.xyz/2021/07/ethereum-reorgs-after-the-merge "paradigm"))

## Methods

##### getAccountShape
The main method responsible for synchronizing an `Account` from an empty state or from a previous iteration of the synchronization process. When the synchronization is based on a previous iteration of itself, we use what we call an "incremental" synchronization, where we only get the difference in state from the previous account, and apply the changes while maintaining javascript refs to prevent re-rendering for UI clients like React. The logic necessary to determine if a synchronization is "incremental" or not is based on the `syncHash` (see `getSyncHash` method) which represents a hash of some deterministic parameters like the supported tokens.

The goal of the coin-evm synchronization is to work progressively with the provided backends, which include:

- `[mandatory]` An RPC node
- `[optional]` An explorer/indexer
- `[optional]` A gas tracker

With only an RPC node, the synchronization should still be able to list and verify transactions created by the user. The explorer/indexer will provide a full history for the given address and provide the tools necessary to infer `TokenAccounts` & `nfts`.
(The gas tracker is utilized by the clients to offer various financing options for the gas required to include the transaction in an upcoming block. So not related to the synchronization)

###### `TokenAccounts` ([ERC20](https://eips.ethereum.org/EIPS/eip-20 "ERC20"))
TokenAccounts are created based on the user's transaction history by simply listing all the unique [ERC20](https://eips.ethereum.org/EIPS/eip-20 "ERC20") contracts the account ever interacted with (received or sent transactions). Then, the `balanceOf` method of those contracts is checked with an RPC node. TokenAccounts are maintained through multiple iterations of synchronization, allowing you to obtain a partial `TokenAccount`, and a method can merge it with its previous state (`mergeSubAccounts` today).

###### `nfts` ([ERC721](https://eips.ethereum.org/EIPS/eip-721 "ERC721")/[ERC1155](https://eips.ethereum.org/EIPS/eip-1155 "ERC1155"))
NFTs are added to each account using a simple plus/minus method based on all `transfer` events for NFTs. Since the provided balance can be crucial to a successful transaction, a reorg, or a simple indexing error could be very problematic for an "incremental" method like the one used for `Accounts` or `TokenAccounts`. As a result, the `nfts` value is processed entirely each time, from scratch, based on all NFT operations. All references should still be maintained by a merging mechanism (`mergeNfts` today).

*NFT support is defined by the client through an environment variable. see `isNFTActive` method in `@ledgerhq/coin-framework.`*
<br/>

##### getSubAccounts
Based on a provided list of [ERC20](https://eips.ethereum.org/EIPS/eip-20 "ERC20") `transfer` events, generates an unique list of smart contracts and subsequently creates and return a `TokenAccount` for each of them.

##### getSubAccountShape
Creates a `TokenAccount` based on a `TokenCurrency` and a list of `Operations`. Responsible for requesting the balance of the token smart contract on an RPC node.

##### getOperationStatus
Check if a single operation has been finalized on the blockchain. Necessary with currencies providing no explorer or for somehow broken explorers.

##### postSync
Hook activated after the synchronization at the `makeSync` level (see `jsHelpers.ts` in `@ledgerhq/coin-framework`)
Optimistic operations are added to both the `pendingOperations` array in `Accounts` and `SubAccounts` (in this case, `TokenAccounts`). However, the logic responsible for removing them once validated only passes through `Accounts`. As a result, we need to introduce specific logic to apply this removal at the `TokenAccount` level as well, to prevent the optimistic operations from being retained indefinitely.