> **Status: FROZEN** — see [MIGRATION.md](./MIGRATION.md) for what moved to DDD packages and what remains here.

## live-wallet

The goal of this library is to manage account-related user data and provide interim sync modules
that depend on coin bridges until `@domain/entity-account` exists.

**Full Ledger Sync stack documentation:** [`docs/ledger-sync`](../../docs/ledger-sync/README.md)

Examples of account user data states (now mostly in `domain/entity/*`):

- Account's name → [`domain/entity/account-name`](../../domain/entity/account-name)
- Account's starred state → [`domain/entity/starred-account`](../../domain/entity/starred-account)
- Recent receive addresses → [`domain/entity/recent-addresses`](../../domain/entity/recent-addresses)
- Account list sync + non-imported accounts → [`src/accounts/`](src/accounts/) (interim)

The library provides reducers and actions in the style of Redux, without depending on Redux itself.
