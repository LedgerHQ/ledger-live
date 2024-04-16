# Bitcoin Family Synchronization Logic in Ledger Live

## Entry Point
The synchronization logic for the Bitcoin family is primarily located in the `makeGetAccountShape` function within `js-synchronisation.ts`.

## Main Data Structures
Like other families in Ledger Live, each account is represented as an `Account`, as defined in `ledgerjs/packages/types-live/src/account.ts`. For the Bitcoin family, there's an additional `BitcoinResources` member within this `Account` to store Bitcoin-specific data structures. `BitcoinResources` includes a `walletAccount`, which contains information about the account's derivation path. Since a Bitcoin family account in Ledger Live is derived from `m / purpose' / coin_type' / account'` (BIP44), each account has a distinct derivation path. The `Xpub` data structure (`wallet-btc/xpub.ts` file) stores an account's information and synchronization status, mainly saved in the `storage` variable, including transactions and UTXOs for each address. Detailed data structure definitions are in `wallet-btc/storage/index.ts` file. To improve the efficiency of maintaining the transactions array, indexing has been added. To avoid recalculating the account's addresses, they are also cached.

## Account Synchronization Logic
The logic for synchronizing an account starts in the `sync()` function in `wallet-btc/xpub.ts`. Here are the steps:
1. **Synchronize All Receiving Addresses:** Derived from `m / purpose' / coin_type' / account' / 0`.
2. **Synchronize All Change Addresses:** Derived from `m / purpose' / coin_type' / account' / 1`.
3. **Batch Synchronization:** In both step 1 and 2, addresses are synchronized in batches of 20. For example, receiving addresses from `m / purpose' / coin_type' / account' / 0 / 0` to `m / purpose' / coin_type' / account' / 0 / 19` are synchronized first. If any address in these 20 has a transaction, the next batch of 20 addresses is synchronized, continuing until a batch with no transactions is found.
4. **Synchronization Details:**
    - Addresses are obtained using `this.crypto.getAddress(this.derivationMode, this.xpub, account, index)`.
    - All confirmed transactions for an address are fetched from `https://explorers.api.live.ledger.com/blockchain/v4/[coin_ticker]/address/[address]/txs`.
    - All pending transactions are fetched from `https://explorers.api.live.ledger.com/blockchain/v4/[coin_ticker]/address/[address]/txs/pending`.
    - All transactions for an address are summarized and UTXOs are calculated and stored in `storage`.
5. **Incremental Synchronization:**
    - To enhance synchronization efficiency, the concept of incremental sync is introduced. If transactions before a certain block height have already been synchronized, there's no need to re-sync them. This block height is saved in `syncedBlockHeight` in `wallet-btc/xpub.ts`.
    - Transactions are fetched with the `from_height` parameter (the http request in step 4) to get transactions only after a certain height.
6. **Handling Blockchain Reorgs:**
    - In case of a blockchain reorg, previously synced transactions might become invalid. To check for reorgs, the block hash at a certain height is fetched from `https://explorers.api.live.ledger.com/blockchain/v4/[coin_ticker]/block/[block_height]` and compared with the hash stored in `storage`. If they differ, all transactions for that address need to be re-synced.

## Post-Synchronization Data Structure
After synchronization, `makeGetAccountShape` returns information describing the account's state for display in LLM/LLD:
1. **UTXOs and Transactions:** Obtained from `storage`.
2. **Account Balance:** Calculated using the `getAccountBalance` function.
3. **Fresh Address:** Calculated during account synchronization. According to BIP44, the fresh address of an account derived from `m / purpose' / coin_type' / account'` is the first address in `m / purpose' / coin_type' / account' / 0 / x` with no transactions.
4. **User Operations History:** Used by LLD/LLM for display operations history in UI, the `mapTxToOperations` function converts transactions into operations history. Operations has more information than transactions, such as nature of the transaction(incoming transaction or outgoing transaction) and distinction between recipient address and change address.
5. **Current Block Height:** Obtained directly from `https://explorers.api.live.ledger.com/blockchain/v4/btc/block/current`.
