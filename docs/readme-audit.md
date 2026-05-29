# README Audit

Tracking file for `LIVE-28131` README refinement.

The audit scope is repo-owned `README.md` files only. Vendored/generated trees
are excluded, including `node_modules`, `.pnpm`, `vendor`, `ios/Pods`, `dist`,
`build`, `.nx`, `.yarn`, `coverage`, and `.turbo`.

## Audit Rules

- Keep README files as short local entry points.
- Keep repo-wide rules in `docs/`.
- Keep repeatable workflows in `.agents/skills/` or narrow local docs.
- Preserve package API reference READMEs when they are the canonical API surface.
- Replace stale wiki/setup content with canonical local docs where possible.
- Work through the queue one file or small related cluster at a time.

## Current Queue

| Status   | Priority | File or cluster                                                                                            | Why                                                                      | Next action                                      |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Done     | P0       | `README.md`                                                                                                | Root entrypoint duplicated setup, package lists, and command guidance    | Keep concise and link to canonical docs          |
| Done     | P0       | `apps/ledger-live-desktop/README.md`                                                                       | Stale Node/pnpm setup and duplicated command detail                      | Keep as app-local entrypoint                     |
| Done     | P0       | `apps/ledger-live-mobile/README.md`                                                                        | Stale platform setup and duplicated E2E guidance                         | Keep as app-local entrypoint                     |
| Done     | P0       | `apps/ledger-live-desktop/tests/README.md`                                                                 | Long old Playwright guide duplicated E2E docs                            | Keep as local tests entrypoint                   |
| Done     | P1       | `apps/cli/README.md` setup section                                                                         | Stale Node/pnpm requirements                                             | Link to `mise.toml` and common commands          |
| Done     | P1       | `e2e/desktop/README.md`, `e2e/mobile/README.md`, `e2e/desktop/docs/README.md`                              | E2E entrypoints pointed to stale GitHub wiki pages and placeholder docs  | Link to local E2E docs and onboarding skills     |
| Done     | P1       | `libs/ledger-live-common/README.md`                                                                        | Stale wiki table of contents and broad library overview                  | Replace with local map and maintained commands   |
| Done     | P1       | `libs/ledgerjs/README.md`                                                                                  | Stale setup wording and deprecated U2F wiki links                        | Link to local migration doc and pinned toolchain |
| Done     | P1       | `libs/ui/README.md`                                                                                        | Broad UI umbrella README has old wording and duplicated install detail   | Keep package map and aliases only                |
| Done     | P2       | `libs/ledger-key-ring-protocol/README.md`, `libs/hw-ledger-key-ring-protocol/README.md`                    | Near-empty package placeholders                                          | Add package purpose and command entrypoint       |
| Done     | P2       | `libs/live-wallet/src/walletsync/modules/README.md`, `libs/live-wallet/src/walletsync/__mocks__/README.md` | Useful templates need clearer local context and less placeholder wording | Tighten module/mock guidance                     |
| Done     | P2       | `libs/coin-modules/coin-tezos/src/README.md`                                                               | Links to old wiki account model                                          | Check for local canonical replacement            |
| Done     | P2       | `libs/coin-modules/coin-evm/docs/evm-family-integration-process/README.md`                                 | Long process doc with older wiki references                              | Review after coin-module docs                    |
| Done     | P2       | `tests/dummy-wallet-app/README.md`                                                                         | Long local workflow doc                                                  | Check for duplicate E2E setup guidance           |
| Reviewed | P3       | Long LedgerJS package API READMEs                                                                          | Mostly canonical API references                                          | Leave unless stale setup/wiki content appears    |
| Reviewed | P3       | Small package READMEs under `domain`, `shared`, `devtools`, `features`                                     | Mostly local package summaries                                           | Spot-check for stale links only                  |

## Residual Search Hits

The final stale-pattern sweep still returns these known false positives or
intentionally deferred package-reference notes:

- `apps/cli/README.md`: `outdated` appears in a literal CLI scenario name.
- `libs/live-wallet/src/walletsync/modules/README.md`: `TODO` appears inside the
  title of an internal Atlassian tutorial URL.
- `libs/ledgerjs/packages/hw-app-eth/README.md`: `outdated` appears in an API
  reference warning about static signatures.
- `libs/ledgerjs/packages/react-native-hw-transport-ble/README.md`: one TODO
  remains in a long package API README and was left outside this README-entrypoint
  cleanup pass.

## Full Inventory

Generated with:

```bash
rg --files --no-ignore -g 'README.md' \
  -g '!**/node_modules/**' \
  -g '!**/.pnpm/**' \
  -g '!**/.git/**' \
  -g '!**/vendor/**' \
  -g '!**/ios/Pods/**' \
  -g '!**/dist/**' \
  -g '!**/build/**' \
  -g '!**/.nx/**' \
  -g '!**/.yarn/**' \
  -g '!**/coverage/**' \
  -g '!**/.turbo/**' | sort
```

### Root

- `README.md`

### Apps

- `apps/cli/README.md`
- `apps/ledger-live-desktop/README.md`
- `apps/ledger-live-desktop/src/renderer/webworkers/README.md`
- `apps/ledger-live-desktop/static/i18n/README.md`
- `apps/ledger-live-desktop/tests/README.md`
- `apps/ledger-live-desktop/tests/mocks/local/README.md`
- `apps/ledger-live-mobile/README.md`
- `apps/ledger-live-mobile/src/GlobalDrawers/README.md`
- `apps/ledger-live-mobile/src/components/SelectDevice2/README.md`
- `apps/ledger-live-mobile/src/devTools/README.md`
- `apps/ledger-live-mobile/src/mocks/README.md`
- `apps/ledger-live-mobile/src/mvvm/components/QueuedDrawer/README.md`
- `apps/ledger-live-mobile/src/transport/bleTransport/README.md`
- `apps/wallet-cli/README.md`
- `apps/wallet-cli/src/shared/accountDescriptor/README.md`
- `apps/wallet-cli/src/test/commands/README.md`
- `apps/wallet-cli/src/wallet/README.md`
- `apps/web-tools/README.md`

### Devtools, Domain, E2E, Features

- `devtools/README.md`
- `devtools/feature-flags/README.md`
- `devtools/registry/README.md`
- `devtools/shell/README.md`
- `domain/api/README.md`
- `domain/entity/README.md`
- `domain/entity/currency-crypto/README.md`
- `domain/entity/currency-fiat/README.md`
- `domain/entity/currency-token/README.md`
- `domain/entity/currency-unit/README.md`
- `domain/entity/currency/README.md`
- `e2e/desktop/README.md`
- `e2e/desktop/docs/README.md`
- `e2e/mobile/README.md`
- `features/flow/market-banner/README.md`
- `features/platform/feature-flags/README.md`

### Shared And Tools

- `scripts/README.md`
- `shared/README.md`
- `shared/feature-flags/README.md`
- `shared/schema-primitives/README.md`
- `tests/dummy-live-app/README.md`
- `tests/dummy-ptx-app/README.md`
- `tests/dummy-wallet-app/README.md`
- `tools/actions/composites/configure-nx-remote-cache-profile/README.md`
- `tools/actions/composites/nx-affected-packages/README.md`

### Libraries

- `libs/client-ids/README.md`
- `libs/client-ids/src/ids/README.md`
- `libs/coin-modules-monitoring/README.md`
- `libs/coin-modules/README.md`
- `libs/coin-modules/coin-canton/README.md`
- `libs/coin-modules/coin-evm/docs/evm-family-integration-process/README.md`
- `libs/coin-modules/coin-tezos/src/README.md`
- `libs/coin-tester/README.md`
- `libs/coin-tester-modules/coin-tester-bitcoin/README.md`
- `libs/coin-tester-modules/coin-tester-evm/README.md`
- `libs/coin-tester-modules/coin-tester-polkadot/README.md`
- `libs/coin-tester-modules/coin-tester-solana/README.md`
- `libs/concordium-core/README.md`
- `libs/device-intent/README.md`
- `libs/disable-network-setup/README.md`
- `libs/domain-service/README.md`
- `libs/evm-tools/README.md`
- `libs/hw-ledger-key-ring-protocol/README.md`
- `libs/ledger-key-ring-protocol/README.md`
- `libs/ledger-key-ring-protocol/scripts/README.md`
- `libs/ledger-live-common/README.md`
- `libs/ledger-live-common/src/bot/portfolio/README.md`
- `libs/ledger-live-common/src/cg-client/README.md`
- `libs/ledger-live-common/src/cmc-client/README.md`
- `libs/ledger-live-common/src/dada-client/README.md`
- `libs/ledger-live-common/src/device/use-cases/ensureAppReady/README.md`
- `libs/live-config/README.md`
- `libs/live-signer-aleo/README.md`
- `libs/live-signer-canton/README.md`
- `libs/live-signer-concordium/README.md`
- `libs/live-signer-cosmos/README.md`
- `libs/live-signer-evm/README.md`
- `libs/live-signer-hyperliquid/README.md`
- `libs/live-signer-solana/README.md`
- `libs/live-signer-zcash/README.md`
- `libs/live-wallet/README.md`
- `libs/live-wallet/src/walletsync/__mocks__/README.md`
- `libs/live-wallet/src/walletsync/modules/README.md`
- `libs/oxc-live-libs/README.md`
- `libs/psbtv2/README.md`
- `libs/speculos-transport/README.md`
- `libs/ui/README.md`
- `libs/ui/packages/icons/README.md`
- `libs/ui/packages/native/README.md`
- `libs/ui/packages/react/README.md`
- `libs/ui/packages/shared/README.md`
- `libs/wallet-api-acre-module/README.md`

### LedgerJS

- `libs/ledgerjs/README.md`
- `libs/ledgerjs/packages/cryptoassets/README.md`
- `libs/ledgerjs/packages/cryptoassets/src/cal-client/README.md`
- `libs/ledgerjs/packages/devices/README.md`
- `libs/ledgerjs/packages/errors/README.md`
- `libs/ledgerjs/packages/hw-app-algorand/README.md`
- `libs/ledgerjs/packages/hw-app-aptos/README.md`
- `libs/ledgerjs/packages/hw-app-btc/README.md`
- `libs/ledgerjs/packages/hw-app-canton/README.md`
- `libs/ledgerjs/packages/hw-app-canton/tests/fixtures/README.md`
- `libs/ledgerjs/packages/hw-app-celo/README.md`
- `libs/ledgerjs/packages/hw-app-concordium/README.md`
- `libs/ledgerjs/packages/hw-app-cosmos/README.md`
- `libs/ledgerjs/packages/hw-app-eth/README.md`
- `libs/ledgerjs/packages/hw-app-exchange/README.md`
- `libs/ledgerjs/packages/hw-app-hedera/README.md`
- `libs/ledgerjs/packages/hw-app-helium/README.md`
- `libs/ledgerjs/packages/hw-app-icon/README.md`
- `libs/ledgerjs/packages/hw-app-kaspa/README.md`
- `libs/ledgerjs/packages/hw-app-multiversx/README.md`
- `libs/ledgerjs/packages/hw-app-near/README.md`
- `libs/ledgerjs/packages/hw-app-polkadot/README.md`
- `libs/ledgerjs/packages/hw-app-solana/README.md`
- `libs/ledgerjs/packages/hw-app-str/README.md`
- `libs/ledgerjs/packages/hw-app-sui/README.md`
- `libs/ledgerjs/packages/hw-app-tezos/README.md`
- `libs/ledgerjs/packages/hw-app-trx/README.md`
- `libs/ledgerjs/packages/hw-app-vet/README.md`
- `libs/ledgerjs/packages/hw-app-xrp/README.md`
- `libs/ledgerjs/packages/hw-bolos/README.md`
- `libs/ledgerjs/packages/hw-transport/README.md`
- `libs/ledgerjs/packages/hw-transport-http/README.md`
- `libs/ledgerjs/packages/hw-transport-mocker/README.md`
- `libs/ledgerjs/packages/hw-transport-node-hid/README.md`
- `libs/ledgerjs/packages/hw-transport-node-hid-noevents/README.md`
- `libs/ledgerjs/packages/hw-transport-node-hid-singleton/README.md`
- `libs/ledgerjs/packages/hw-transport-node-speculos/README.md`
- `libs/ledgerjs/packages/hw-transport-node-speculos-http/README.md`
- `libs/ledgerjs/packages/hw-transport-vault/README.md`
- `libs/ledgerjs/packages/hw-transport-web-ble/README.md`
- `libs/ledgerjs/packages/hw-transport-webhid/README.md`
- `libs/ledgerjs/packages/hw-transport-webusb/README.md`
- `libs/ledgerjs/packages/logs/README.md`
- `libs/ledgerjs/packages/react-native-hid/README.md`
- `libs/ledgerjs/packages/react-native-hw-transport-ble/README.md`
- `libs/ledgerjs/packages/swift-bridge-hw-app-eth/README.md`
- `libs/ledgerjs/packages/swift-bridge-hw-app-solana/README.md`
- `libs/ledgerjs/packages/swift-bridge-hw-transport-ble/README.md`
- `libs/ledgerjs/packages/types-cryptoassets/README.md`
- `libs/ledgerjs/packages/types-devices/README.md`
- `libs/ledgerjs/packages/types-live/README.md`
