# Ledger Wallet

**Previously known as "Ledger Live"**

External developers: also see [Ledger Developer Portal](https://developers.ledger.com/docs/ledger-live/contributing/getting-started) for guides like [Blockchain Support guide](https://developers.ledger.com/docs/coin/general-process).

## Apps

The repository houses the companion apps for [Ledger hardware wallet signers](https://shop.ledger.com) allowing users to manage crypto, install apps on device, update firmware, verify and sign transactions.

Download production apps from https://download.live.ledger.com

- **[Ledger Wallet Desktop (LWD)](apps/ledger-live-desktop/README.md)** – Desktop app built with Electron.
- **[Ledger Wallet Mobile (LWM)](apps/ledger-live-mobile/README.md)** – Android and iOS apps built with React Native.
- **[Wallet CLI](apps/wallet-cli/README.md)** – Agent-optimized CLI toolset.
- **[CLI](apps/cli/README.md)** – Legacy npm CLI for QA and power users.

## npm packages

The repo is also home to 150+ library packages that are consumed both internally by the apps and externally by third-party developers integrating with Ledger hardware.

Public packages are published to npm by [ldg-github-ci](https://www.npmjs.com/~ldg-github-ci).

## Getting started

The repo uses:

- [mise](https://mise.jdx.dev/) for pinned local tool versions
- [pnpm workspaces](https://pnpm.io/) for npm package management
- [Nx](https://nx.dev/) for task orchestration and repo management
- [Changesets](https://github.com/changesets/changesets) for changelogs and publishing

To install everything run:

```bash
mise install
pnpm i
```

What to run next depends on the workspace you're targeting. See [repo commands](docs/repo-commands.md) for build, dev, lint, and test recipes, or check the README in the relevant workspace.

### Finding documentation

1. **Repo-wide** — [AGENTS.md](AGENTS.md), then [docs/](docs/)
2. **Task-specific (agents)** — [.agents/skills/](.agents/skills/)
3. **Local** — README in the workspace or package you're working in

### Overall structure

| Path        | Purpose                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `.agents/`  | Shared agent-facing docs                                                                                   |
| `apps/`     | Desktop, mobile and CLI apps                                                                               |
| `devtools/` | Internal developer tooling and shell helpers                                                               |
| `docs/`     | Repo-wide canonical docs                                                                                   |
| `domain/`   | Domain packages (`entity/`, `api/`)\*                                                                      |
| `e2e/`      | E2E tests using [Detox](https://wix.github.io/Detox/) and [Speculos](https://github.com/LedgerHQ/speculos) |
| `features/` | Features shared across apps\*                                                                              |
| `libs/`     | Legacy shared code\*                                                                                       |
| `patches/`  | `patchedDependencies` auto-applied during pnpm install                                                     |
| `scripts/`  | Repo-level utility scripts                                                                                 |
| `shared/`   | Cross-cutting packages used in domain/, features/ and apps/\*                                              |
| `tests/`    | Dummy apps for testing (dapps, wallet)                                                                     |
| `tools/`    | CI actions, GitHub bots and Nx plugins                                                                     |

\*Prefer `domain/`, `features/` and `shared/` over the legacy `libs/` directory.

## Nightly releases

- **Desktop binaries** and **Android APKs** are attached to build workflows – see [GitHub Actions](https://github.com/LedgerHQ/ledger-live/actions).
- Authorised users can also access [Testflight](https://developer.apple.com/testflight/), [Google Play Console](https://play.google.com/console) and [ledger-live-build](https://github.com/LedgerHQ/ledger-live-build) repository.
- Nightly **packages** are published with `@nightly` dist-tag, e.g. `npm i @ledgerhq/hw-app-eth@nightly`
- More details on the Wiki: https://github.com/LedgerHQ/ledger-live/wiki/Release-Process#nightlies

## License

Please check each project `LICENSE` file, most of them are under the MIT license.
