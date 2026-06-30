# @ledgerhq/ledger-key-ring-protocol

Ledger Key Ring Protocol layer.

## Testing the SDK with recorded scenarios

The SDK is exercised end-to-end through **scenarios** that are recorded once against
real infrastructure and then **replayed** deterministically in unit tests — no device
and no network needed in CI.

### The three pieces

- **Scenarios** — `tests/scenarios/*.ts`. Each file exports a
  `scenario(deviceId, options)` function (and optional `recorderConfig`) that drives the
  SDK through a real user flow and asserts the expected behaviour with `expect(...)`. The
  same function is used both to record and to replay, so an assertion failure is caught in
  either mode. See `tests/scenarios/_template.ts` to start a new one.

- **Snapshots** — `mocks/scenarios/<slug>.json`. Recorded once per scenario, they capture
  everything needed to replay it deterministically:

  - `apdus` — the device APDU exchanges (replayed via `openTransportReplayer`),
  - `http.transactions` — the trustchain-backend HTTP traffic (request + response),
  - `crypto` — the random bytes / keypairs generated, so the run is reproducible.

- **Tests** — `src/__tests__/integration/`:
  - `sdk.test.ts` replays every snapshot: APDUs come from the recorded store, HTTP is
    served by MSW from the recorded transactions, and `crypto` randomness is mocked from
    the recorded outputs. Each request is matched against the snapshot, so a change in SDK
    behaviour (different call, body, or order) fails the test.
  - `mock.sdk.test.ts` runs the same scenarios against the in-memory mock SDK
    (`MOCK=1`), skipping the ones listed as non-mockable.

### Recording / re-recording a snapshot

Recording runs the scenario for real — against a Speculos device (Docker) and the staging
trustchain backend — and writes the snapshot. Prerequisites:

- Docker running (Speculos is launched in a container),
- `COIN_APPS` pointing to a clone of [coin-apps](https://github.com/LedgerHQ/coin-apps)
  (provides the Ledger Sync app loaded into Speculos),
- network access to staging.

```sh
COIN_APPS=/path/to/coin-apps pnpm --filter @ledgerhq/ledger-key-ring-protocol e2e
```

The script only records snapshots that don't exist yet, so to **re-record** one (e.g. after
a backend change), delete its JSON first:

```sh
rm mocks/scenarios/<slug>.json
COIN_APPS=/path/to/coin-apps pnpm --filter @ledgerhq/ledger-key-ring-protocol e2e
```

Set `RUN_EVEN_IF_SNAPSHOT_EXISTS=1` to run a scenario live without overwriting its snapshot
(handy to check it still passes against staging). Speculos loopback traffic is filtered out
of the snapshot, and compressed response bodies are decoded before being stored, so the
replay can serve them as plain JSON.

The hardware-specific integration lives in
[../hw-ledger-key-ring-protocol](../hw-ledger-key-ring-protocol/README.md), and
the deterministic E2E replay script is documented in
[scripts/README.md](scripts/README.md).

Run package commands from the repository root:

```bash
pnpm lkrp build
pnpm lkrp test
pnpm lkrp typecheck
```
