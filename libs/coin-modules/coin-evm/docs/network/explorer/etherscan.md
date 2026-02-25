# `etherscan.ts`
Set of functions designed to retrieve transactions associated with an account through explorers that utilize the [etherscan API](https://docs.etherscan.io/api-endpoints/accounts).

### Constants

#### ETHERSCAN_TIMEOUT
Minimum time between two requests, allowing for retries after a failure.

#### DEFAULT_RETRIES_API
Number of retries when a request fails.

### Methods
#### fetchWithRetries
This helper function wraps the basic axios request method, incorporating handling for retries upon failure. This is particularly relevant due to a rate limit on etherscan requests without an API key, allowing only one request every 5 seconds.

#### getLastCoinOperations
Uses `fetchWithRetries` to retrieve coin transactions for a given address. This method does not consider any outcomes resulting from that transaction, such as internal transactions or events.

#### getLastTokenOperations
Uses `fetchWithRetries` to retrieve ERC20 transfer events for a specified address. These transfer events are often treated as "transactions" for simplicity, but they are essentially side effects of a coin transaction interacting with a smart contract, indicating that a particular smart contract has completed an action.

#### getLastERC721Operations
Uses `fetchWithRetries` to retrieve ERC721 (NFT) transfer events for a specified address. Similar to ERC20 transfer events, these are often regarded as "transactions" for simplicity, though they are actually side effects of a coin transaction interacting with a smart contract, signifying the completion of a specific smart contract transfer action.

#### getLastERC1155Operations
Uses `fetchWithRetries` to retrieve ERC1155 (NFT) transfer events for a specified address. Similar to ERC20 transfer events, these are often regarded as "transactions" for simplicity, though they are actually side effects of a coin transaction interacting with a smart contract, signifying the completion of a specific smart contract transfer 

#### getLastNftOperations
A wrapper around the two NFT fetching operations.

#### getLastInternalOperations
Uses `fetchWithRetries` to fetch internal transactions for a specified address. These transactions are a byproduct of a coin transaction interacting with a smart contract, causing that smart contract to create transactions itself.

#### getLastOperations
Responsible for triggering all the other methods to fetch every type of transaction possible and return each type separately.
