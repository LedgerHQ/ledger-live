# @features/platform-send-flow

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Platform-agnostic core of the Send flow shared by Ledger Wallet Desktop and Mobile: flow state and steps, the `*Core` hooks the apps wrap in their view models (amount, fees, coin control, recipient, signature), the send descriptor types and accessors, and the sponsored-fee send (`./sponsored`).

## Entries

| Import | Contents |
| --- | --- |
| `@features/platform-send-flow` | Flow types and steps, hooks, utils, `SendFlowPortsProvider`, the type registry |
| `@features/platform-send-flow/errors` | `TransactionBroadcastError`, React-free |
| `@features/platform-send-flow/fees` | Fee preset estimation helpers, React-free |
| `@features/platform-send-flow/descriptor` | `SendDescriptor` and related types, `createSendFeatures`, `resolveFeeUnitLabel` |
| `@features/platform-send-flow/sponsored` | Sponsored-fee session, orchestration, quote and tracking hooks, `SponsoredCoinApi` |
| `@features/platform-send-flow/sponsored-api` | `SponsoredCoinApi` and the sponsored-fee types, React-free |
| `@features/platform-send-flow/testing/sponsored` | USDT sponsored-fee fixtures for tests |

## Binding the flow to a coin layer

The package never imports `libs/`. What it needs from the coin layer comes in two ways:

- **Ports**: behaviour (account bridges, send descriptors, memo patches, recent addresses, account sync, the sponsored seam), declared by `SendFlowPorts` and supplied once with `<SendFlowPortsProvider ports={...}>` above the flow. Pure functions that need a port take it as their first argument, e.g. `getSendUiConfig(sendFeatures, currency)`.
- **Type registry**: the account, transaction, status, operation and bridge types. The host augments `SendFlowTypeRegistry`; unregistered keys fall back to the structural `Send*Base` types the package typechecks and tests against.

```ts
declare module "@features/platform-send-flow" {
  interface SendFlowTypeRegistry {
    account: Account;
    transaction: Transaction;
  }
}
```

Both apps mount the provider at the Send flow root with `liveCommonSendFlowPorts` from `@ledgerhq/live-common/flows/send-ports/ports`, which also registers live-common's types.

Tests inject fake ports with `createTestSendFlowPorts` and `createSendFlowPortsWrapper` from `src/test-utils/sendFlowPorts.tsx`.
