# `ledger.ts`
Set of functions designed to retrieve transactions associated with an account through the [Ledger explorers](https://explorers.api.live.ledger.com/blockchain/v4/eth/docs/).

### Constants

#### BATCH_SIZE
Maximum number of transactions returned by a single explorer request.


#### LEDGER_TIMEOUT
Minimum time between two requests for retry after a failure.

#### DEFAULT_RETRIES_API
Number of retries when a request fails.

### Methods

#### fetchPaginatedOpsWithRetries
This is a general request method responsible for fetching all transactions of all types for a given address. It manages retries and pagination for a complete retrieval.

#### getLastOperations
This method utilizes `fetchPaginatedOpsWithRetries` to retrieve all transactions, sort them by type, and return each type separately.
