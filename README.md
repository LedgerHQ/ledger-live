# Ledger Wallet JavaScript Ecosystem

`ledger-live` is the JavaScript and TypeScript monorepo for Ledger Wallet apps,
shared packages, tooling, and end-to-end test projects.

Ledger Wallet is the companion experience for Ledger hardware wallets. It lets
users manage crypto assets, install device apps, update firmware, verify public
addresses, and sign transactions.

## Start Here

Run commands from the repository root unless a local README says otherwise.

```bash
mise install
pnpm i
```

Use `pnpm i --ignore-scripts` when you only need dependencies and want to skip
long or app-specific postinstall steps.

Common workflows live in canonical docs:

| Need                                                  | Read                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------- |
| Setup, build, dev, lint, typecheck, and test commands | [docs/common-commands.md](docs/common-commands.md)                     |
| Required checks before finishing a code change        | [docs/validate-before-finishing.md](docs/validate-before-finishing.md) |
| Documentation structure and README expectations       | [docs/about-docs/docs-locations.md](docs/about-docs/docs-locations.md) |

For app-specific prerequisites, continue with the local app README:

- [Ledger Live Desktop](apps/ledger-live-desktop/README.md)
- [Ledger Live Mobile](apps/ledger-live-mobile/README.md)
- [ledger-live CLI](apps/cli/README.md)
- [wallet-cli](apps/wallet-cli/README.md)

## Workspace Map

| Path                       | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `apps/ledger-live-desktop` | Electron desktop app (`pnpm desktop`)                            |
| `apps/ledger-live-mobile`  | React Native mobile app (`pnpm mobile`)                          |
| `apps/cli`                 | Published `@ledgerhq/live-cli` package (`pnpm cli`)              |
| `apps/wallet-cli`          | Experimental DMK-based wallet CLI (`pnpm wallet-cli`)            |
| `libs/ledger-live-common`  | Shared Ledger Wallet business logic (`pnpm common`)              |
| `libs/ledgerjs`            | LedgerJS packages for device apps, transports, and crypto assets |
| `libs/coin-modules`        | Coin family integrations and coin module packages                |
| `libs/ui`                  | Shared React, React Native, icon, and UI packages                |
| `e2e/desktop`              | Desktop Playwright and Speculos tests (`pnpm e2e:desktop`)       |
| `e2e/mobile`               | Mobile Detox and Speculos tests (`pnpm e2e:mobile`)              |
| `docs`                     | Repo-wide canonical docs                                         |
| `.agents`                  | Shared agent skills, sub-agents, and agent-facing docs           |

Most packages also have their own `README.md` for local context. Prefer those
files for package-specific conventions, and prefer `docs/` for repo-wide rules.

## Development Notes

This repo uses:

- [mise](https://mise.jdx.dev/) for pinned local tool versions from `mise.toml`
- [pnpm workspaces](https://pnpm.io/) for package management
- [Nx](https://nx.dev/) and [Turborepo](https://turbo.build/repo) for task orchestration
- [Changesets](https://github.com/changesets/changesets) for changelogs and publishing

Useful root aliases include:

```bash
pnpm desktop typecheck
pnpm mobile test:jest
pnpm --filter <package-name> test
pnpm turbo build --filter=@ledgerhq/<lib-name>
```

See [docs/common-commands.md](docs/common-commands.md) for the maintained command
list instead of duplicating command details here.

## External Developer Documentation

For broader Ledger Wallet contribution and integration guides, including
blockchain, token, swap, staking, Discover/Live Apps, testing strategy, and git
conventions, use the [Ledger Developer Portal](https://developers.ledger.com/docs/ledger-live/contributing/getting-started).

Developers adding blockchain support should start with the
[Blockchain Support guide](https://developers.ledger.com/docs/coin/general-process).

## Releases

Nightly builds and packages are produced from `develop`.

- Desktop binaries are attached to the desktop build workflow.
- Mobile Android APKs are attached to the mobile build workflow.
- Library packages are published nightly to npm with the `@nightly` dist-tag.

```bash
npm i @ledgerhq/live-common@nightly
```

## License

Check each package `LICENSE` file. Most packages are licensed under MIT.
