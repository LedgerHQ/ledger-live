# `rpc.ts`
Set of functions specific to interacting with an EVM RPC Node. The JSON-RPC API is documented [here](https://ethereum.org/developers/docs/apis/json-rpc).

### Constants

#### RPC_TIMEOUT
Minimum time between two requests for retry after a failure.

#### DEFAULT_RETRIES_RPC_METHODS
Number of retries when a request fails.

### Methods
#### withApi
A helper function encapsulating the `StaticJsonRpcProvider` object and incorporating retry handling in case of failure.

#### getTransaction
Retrieves a transaction by hash and returns its block and nonce.

#### getCoinBalance
Provides the amount of coin for a given address in wei.


#### getTokenBalance
Returns the amount of tokens for a given address based on the balanceOf method of the [ERC20 standard](https://eips.ethereum.org/EIPS/eip-20). This request will be batched with other requests made in the same synchronization.

#### getTransactionCount
Returns the number of transaction made by an account. This will be then used as nonce for a future transaction crafting.

#### getGasEstimation
Simulates a transaction to estimate the amount of gas consumed in executing the transaction on the blockchain. If the transaction is impossible (e.g. sending more than the account owns), the simulation will fail and no estimation will be returned.

#### getFeeData
In charge of finding the different elements for the gas pricing depending on the chain ability to use [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) or not. If the chain supports EIP-1559, it should return a `maxPriorityFeePerGas`, a `maxFeePerGas` & a `nextBaseFee`, otherwise it should simply return a `gasPrice` value.

#### broadcastTransaction
Broadcasts an RLP serialized signed transaction and returns its hash to poll a node using the `getTransaction` method, determining when it has been added to a block.

#### getBlockByHeight
Fetches basic information from a block by its height, primarily used to obtain its creation timestamp.

#### getOptimismAdditionalFees
Requests an oracle smart contract to estimate the L1 fee that an account will need to pay for an optimism transaction to be included in a block. This fee is related to data availability. For more information, refer to: https://docs.optimism.io/builders/dapp-developers/transactions/estimates
