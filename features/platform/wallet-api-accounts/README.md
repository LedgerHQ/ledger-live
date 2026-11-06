# @features/platform-wallet-api-accounts

> [!CAUTION]
> **Status: UNSTABLE.** Exploratory: a proof of concept of the Wallet API reading accounts without the legacy `Account`.

The accounts the Wallet API exposes to third-party live apps (`account.list`, `account.request`), built from the account data entities:

| Wallet API field | From |
| --- | --- |
| `id`, `parentAccountId` | uuid v5 of the legacy id, as live-common derives it, so live apps keep their stored ids; of the `AccountUUID` for an account only known remotely |
| `name` | `@domain/entity-account-name`, else the default name from the descriptor's path |
| `currency`, token accounts | the descriptor's network, then one token account per token row of the balance |
| `balance`, `spendableBalance` | `@domain/entity-account-balance` |
| `address`, `readiness` | `@domain/entity-account-receive` |
| `lastSyncDate` | when the balance was read |
| `blockHeight` | `undefined`, which the protocol allows |

`useWalletAPIAccountsProvider(accountNames)` gives the Wallet API server a provider that reads the `balance` and `receive` kinds of the accounts, then builds them from the slices. Apps mount the `accounts` entity slice at `accountEntries`.

See [the account data layer](../../../docs/account-data-layer.md).
