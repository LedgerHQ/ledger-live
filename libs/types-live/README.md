<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

## @ledgerhq/types-live

> [!WARNING]
> **Status: DEPRECATED** — Legacy, in maintenance mode: editing existing types is fine, but new types live with the package that owns them in the [monorepo layers](../../docs/monorepo-architecture.md). The account types below are being retired.

Ledger Live main types.

## Account types are legacy

`Account`, `TokenAccount` and `AccountLike` are being retired, together with BridgeSync and the FullSync they feed. New code never takes them:

| Instead of | Use |
| --- | --- |
| `Account`, `account.id` | `AccountDescriptor` and its `AccountUUID`, from `@domain/entity-account-descriptor` |
| `Account[]` from the legacy store | the `accounts` slice of `@domain/entity-account` |
| `balance`, `operations`, `balanceHistoryCache`… | one `account-*` entity per concept, read with `useAccountData` |
| `TokenAccount`, `subAccounts` | the token's rows in each entity, by `assetId` |

Where each field goes and what is left: [docs/account-models](../../docs/account-models/README.md).
