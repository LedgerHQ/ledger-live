# @ledgerhq/live-common

> [!WARNING]
> **`@ledgerhq/live-common` is in maintenance mode and is being progressively dismantled.**
> Do **not** add new features, folders or top-level modules here. Bugfixes and edits to existing
> code are welcome. New shared logic belongs in a dedicated `libs/*` package.

`@ledgerhq/live-common` contains shared Ledger Wallet business logic used by
Ledger Live Desktop, Ledger Live Mobile, CLI tooling, tests, and coin
integrations.

It depends on LedgerJS packages for device communication and exposes core wallet
logic for accounts, currencies, bridges, countervalues, apps, firmware flows,
serialization, and related utilities.

This is an internal monorepo package (`"private": true`) and is no longer
published to npm — consume it through the workspace.

## Local Map

| Area | Purpose |
| ------------------------- | --------------------------------------------- |
| `src/account` | Account models and portfolio helpers |
| `src/currencies` | Currency models, lookup, and metadata helpers |
| `src/families` | Coin-family-specific bridge logic |
| `src/hw` and `src/device` | Hardware wallet and device flows |
| `src/apps` | Device app catalog and install/update logic |
| `src/countervalues` | Countervalue data and helpers |
| `src/e2e` | Shared enums and helpers used by E2E tests |

Narrower local docs:

- [DADA Client](src/dada-client/README.md)
- [CG Client](src/cg-client/README.md)
- [CMC Client](src/cmc-client/README.md)
- [Portfolio bot helpers](src/bot/portfolio/README.md)
- [Ensure App Ready](src/device/use-cases/ensureAppReady/README.md)

## Development

Run commands from the repository root.

```bash
pnpm common build
pnpm common watch
pnpm common lint
pnpm common lint:fix
pnpm common format:check
pnpm common typecheck
pnpm common test
```

Linting uses oxlint with `.oxlintrc.json`. Formatting uses oxfmt with
`.oxfmtrc.json`; run `pnpm common format` when you intentionally want to apply
formatting.

## Related Docs

- Repo commands: [../../docs/repo-commands.md](../../docs/repo-commands.md)
- Validation before finishing: [../../docs/validate-before-finishing.md](../../docs/validate-before-finishing.md)
- Coin modules: [../coin-modules/README.md](../coin-modules/README.md)
- LedgerJS: [../ledgerjs/README.md](../ledgerjs/README.md)
- Blockchain support process: [Ledger Developer Portal](https://developers.ledger.com/docs/coin/general-process/)
