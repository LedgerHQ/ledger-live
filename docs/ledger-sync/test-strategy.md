# Test strategy

Ledger Sync is tested at every layer of the [stack](./README.md), with carefully
**deterministic** tests so they run in CI without a device or network.

```mermaid
flowchart TB
    subgraph e2e["end-to-end + integration"]
        lkrp["LKRP scenarios<br/>(device APDU + Trustchain API)"]
    end
    subgraph unit["unit"]
        wsdm["WalletSyncDataManager<br/>(generic + specific + compatibility)"]
    end
    lkrp -.-> wsdm
```

## Deterministic scenario tests (LKRP)

The [TrustchainSDK](./02-trustchain-sdk.md) has end-to-end **and** integration tests that run
fully deterministically by **mocking everything external**: HTTP via `msw`, device APDU via
`hw-transport-mocker`, and crypto randomness (monkey-patched).

The trick: a scenario is recorded **once** end-to-end against a real Speculos device + staging
API, then **replayed** deterministically forever after.

- Record missing snapshots: the lib's `e2e` script
  ([`scripts/e2e.ts`](../../libs/ledger-key-ring-protocol/scripts/e2e.ts)). To regenerate one,
  delete its JSON and re-run.
- Snapshots live in [`mocks/scenarios/*.json`](../../libs/ledger-key-ring-protocol/mocks/scenarios)
  (recorded `apdus`, `http.transactions`, and `crypto` randomness).
- Replayed by `src/__tests__/integration/sdk.test.ts` (against the real SDK) and the mock SDK.

A scenario is a single **isomorphic** TypeScript file — the *same* function is used to record and
to replay, so an assertion failure is caught in either mode. They live in
[`tests/scenarios/`](../../libs/ledger-key-ring-protocol/tests/scenarios) (start from
`_template.ts`). Example:

```ts
// tests/scenarios/tokenExpires.ts
export async function scenario(deviceId: string, { withDevice, pauseRecorder }: ScenarioOptions) {
  const apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING");
  const hwDeviceProvider = new HWDeviceProvider(apiBaseUrl, withDevice);
  const sdk = new SDK({ applicationId: 16, name: "Foo", apiBaseUrl }, hwDeviceProvider);
  const creds = await sdk.initMemberCredentials();

  const jwt1 = await hwDeviceProvider.withJwt(deviceId, jwt => Promise.resolve(jwt));
  await pauseRecorder(6 * 60 * 1000);
  const { trustchain } = await sdk.getOrCreateTrustchain(deviceId, creds);
  const jwt2 = await hwDeviceProvider.withJwt(deviceId, jwt => Promise.resolve(jwt));
  expect(jwt1).not.toEqual(jwt2); // jwt refreshed after expiry
  await sdk.destroyTrustchain(trustchain, creds);
}
```

(Some scenarios instead take a `sdkForName(name)` helper from `ScenarioOptions` to drive
several members in one scenario — see `_template.ts`.)

The recorder/replayer glue (< 200 LoC) is in `tests/test-helpers/`. See
[behaviour scenarios](./scenarios.md) for the catalogue of what these cover.

## WalletSyncDataManager unit tests

The [WalletSyncDataManager](./05-wallet-sync-data-manager.md) is tested in three complementary
ways under [`src/walletsync/__tests__`](../../libs/live-wallet/src/walletsync/__tests__):

- **Generic** (`generic.test.ts`) — verifies the invariant properties *every* module must hold,
  run against all modules with a large bank of randomly generated states. Catches a broken module
  implementation early and locks in non-regressions. Requires each module to provide state
  generators in [`__mocks__/`](../../libs/live-wallet/src/walletsync/__mocks__) (see its README).
- **Specific** (`specific.test.ts` + `__tests__/modules/*.test.ts`) — hand-written expectations
  for known, specific scenarios per module (e.g. `accounts.test.ts`).
- **Compatibility** (`compatibility.test.ts`) — proves the module set can evolve (modules added
  or removed) and that Wallet Sync still behaves correctly — the basis for the
  [forward-compatibility guarantee](./05-wallet-sync-data-manager.md#a-modular-architecture).
