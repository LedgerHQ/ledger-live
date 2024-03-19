# `specs.ts`

`specs.ts` exports a list of `AppSpec`, which represents test flows to be executed with the `ledger-live-bot`. The purpose of these tests is to verify the execution of a transaction in a specific manner while following specific invariants.
Since `@ledgerhq/coin-evm` is a framework that supports a potentially vast number of currencies, the `AppSpecs` are generated in a nearly identical manner for each chain. Along the way, certain customization properties are added to accommodate chains with specific requirements.

### Constants
#### testTimeout
Amount of time before `ledger-live-bot` stops doing synchronizations in order to verify a transaction. Due to rate limits on explorers & sometimes RPC nodes, this value is quite high for now (*10 minutes*).

#### minBalancePerCurrencyId
Minimum amount of coins the account should have in order to execute the `AppSpecs`. Since value differs a lot depending on the chains, you might need this configuration to allow for an amount lower than 1coin.

### Methods
##### testCoinDestination
Method checking if the recipient of a transaction received the right amount by synchronizing it as well.