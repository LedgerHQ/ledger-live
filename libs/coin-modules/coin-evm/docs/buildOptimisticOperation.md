# `buildOptimisticOperation.ts`
Set of functions responsible for building a temporary operation working as a placeholder for an ongoing transaction waiting for confirmation or rejection. Once validated or rejected by the blockchain, this operation should be overridden by the finalized one.

## Methods

#### buildOptimisticCoinOperation 
In charge of building an optimistic operation for a simple coin transfer. 
> e.g. Sending ETH to another address on Ethereum

#### buildOptimisticTokenOperation 
In charge of building an optimistic operation for a token ([ERC20](https://eips.ethereum.org/EIPS/eip-20)) transfer. 
>e.g. Sending USDC to another address on Ethereum

#### buildOptimisticNftOperation 
In charge of building an optimistic operation for an NFT ([ERC721](https://eips.ethereum.org/EIPS/eip-721) or [ERC1155](https://eips.ethereum.org/EIPS/eip-1155)) transfer. 
>e.g. Sending 1 [Bored Ape](https://opensea.io/collection/boredapeyachtclub) to another address on Ethereum

#### buildOptimisticOperation <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
Default function in charge of crafting an optimistic operation for all kinds of operation. Act as the main entrypoint and then dispatches to the right specific method.