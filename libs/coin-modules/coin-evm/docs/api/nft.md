# `nft`
Set of functions necessary for retrieving off-chain data related to an NFT.

### Methods
#### getNftMetadata
Retrieves (mostly) off-chain data associated with a specific NFT `tokenId` using the `tokenURI` method of an NFT contract (ERC721/ERC1155).

#### getNftCollectionMetadata
Retrieves the value returned by the `name` function of an NFT contract (ERC721/ERC1155) serving as the NFT collection name.