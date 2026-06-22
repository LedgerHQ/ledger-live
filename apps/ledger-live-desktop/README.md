# Ledger Wallet Desktop

Ledger Wallet Desktop (LWD) is the Electron app for Ledger hardware wallets on macOS, Windows, and Linux. Users can manage crypto assets, install apps on Ledger devices, update firmware, verify public addresses, and sign transactions.

- Download: [ledger.com/ledger-live](https://www.ledger.com/ledger-live/)
- System requirements: [Ledger Support](https://support.ledger.com/article/4403310017041-zd)

## Verified

Releases are signed, and the updater verifies signatures before applying a new
version. Hash/signature verification details are available on
[live.ledger.tools/lld-signatures](https://live.ledger.tools/lld-signatures).

## Architecture

The app is built with Electron, React, Redux, and RxJS. It uses shared Ledger Wallet logic to communicate with devices, synchronize accounts, and prepare transactions.

Main source areas:

| Path                    | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `src/main`              | Electron main process                                                   |
| `src/renderer`          | React UI, screens, modals, bridges, analytics, i18n, and renderer setup |
| `src/renderer/families` | Per coin modules family UI logic                                        |

Details of related apps and code sharing are in the root level readme.

## Prerequisite

Run all commands from repository root:

```bash
mise install
pnpm install
```

USB/HID native dependencies for Linux:

```bash
sudo apt-get update
sudo apt-get install libudev-dev libusb-1.0-0-dev
```

## Development

After pulling latest changes:

```bash
pnpm install
pnpm build:lld
```

Run the app:

```bash
pnpm dev:lld        # Run the dev build
pnpm dev:lld:msw    # Run the dev build with Mock Service Workers enabled
```

## Testing

Within LWD, use the following commands for TDD and validatiion checks:

```bash
pnpm nx run ledger-live-desktop:test:jest --with-deps    # unit tests
pnpm desktop lint                                        # lint check
pnpm desktop lint:guardrails                             # security focused lint check
pnpm desktop typecheck                                   # typecheck
```

### E2E Testing

See [`e2e/destkop/README.md`](../../e2e/desktop/README.md) for End-to-End testing details.

## Environment variables

Environment variables are defined in `envDefinitions` within [libs/env/src/env.ts](../../libs/env/src/env.ts).

To force a particular value, passed it in from the CLI when starting the app,

e.g.

```bash
ANALYTICS_CONSOLE=TRUE pnpm dev:lld
```

## Translations and localisation

Translations are handled internally at Ledger. If a translation string is broken, report it to [Ledger support](https://support.ledger.com/) rather than editing localized content directly.
