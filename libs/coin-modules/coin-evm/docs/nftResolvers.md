# `nftResolvers.ts`
Set of functions in charge of providing NFTs & their contracts metadata.

## Methods

#### nftMetadata <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
This method is responsible for fetching metadata related to NFTs (information such as title, images, description, collection's name and more), based on the currency associated with each NFT.  In theory, each currency can utilize a distinct backend to fulfill the request. Currently, Ledger has developed an aggregator known as the "NFT Metadata Service (NMS)" to handle this abstraction. This service ensures that users do not need to manually switch between providers based on their blockchain compatibility.
When utilizing the NMS, it is advisable to take advantage of its batching capability to minimize the number of HTTP requests made on the user's side. This optimization can be achieved using the `metadataCallBatcher` method provided within the `@ledgerhq/coin-framework` library.


#### collectionMetadata <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
This method is responsible for retrieving information related to an NFT smart contract, primarily focusing on the NFT contract's `name` (as documented [here](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/2c6b859dd02f872959cff58d89c979c363778cce/contracts/token/ERC721/ERC721.sol#L74)), also referred to as the collection's name or the token's name.
Understanding the need for this method might seem unclear at first glance, especially when the `nftMetadata` method should, theoretically, return the collection's name for each NFT. However, the need for this dedicated collection-specific method arises from the way the NMS and its providers function. Requesting an unindexed NFT will result in a 404 error. But this 404 error only indicates that the particular NFT is not indexed. It does not imply that another NFT in the same collection is unindexed or that at least the contract's `name` has not been indexed. This is especially true if you make a request immediately after minting an NFT, which might not already be known by the NMS providers.
Consequently, if you happen to own only one NFT in a collection that is not indexed, you would not be able to determine the collection's name based solely on the 404 response you receive for its metadata. Having a dedicated request for fetching only the collection's metadata can significantly enhance the user interface, providing valuable information about the collection, rather than displaying just a 20 character hexadecimal string as a placeholder for its name.