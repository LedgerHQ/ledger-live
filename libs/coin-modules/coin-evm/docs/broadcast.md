# `broadcast.ts`

## Methods

#### broadcast <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
In charge of sending a signed transaction to a node in order for that node to add it into its [mempool](https://www.alchemy.com/overviews/what-is-a-mempool). 
Once received, the node should return the transaction *hash* that will represent that transaction on all the nodes & explorers of the network. This hash will then be used to patch the *optimisticOperation* created by the live, helping the process of overriding that *optimisticOperation* once the finalized operation is received after a new synchronization.

