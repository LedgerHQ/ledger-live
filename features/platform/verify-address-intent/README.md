# @features/platform-verify-address-intent

> [!CAUTION]
> **Status: UNSTABLE** — part of the Device Intent Executor (DIE) rollout; API may change.

Cross-platform [Device Intent](../device-intent/README.md) that verifies a
receive address on the device Secure Screen.

## What it does

The job hands the live DMK session to a **host-injected** device operation and
maps its device-action stream to a small, UI-friendly state union:

| `JobState`    | Meaning                                                       | Terminal |
| ------------- | ------------------------------------------------------------- | -------- |
| `verifying`   | Address is being displayed on the device, awaiting the user.  | no       |
| `verified`    | Device address matches the expected one.                      | yes      |
| `mismatch`    | Device address differs from the expected one.                 | yes      |
| `cancelled`   | User refused on device. Carries a `retry()` handler.          | no       |
| `unsupported` | Device app cannot display the address.                        | yes      |

Any other device failure escapes as an observable error, so the executor renders
its shared intent-error screen.

`verified` vs `mismatch` is decided by an **encoding-aware** comparison: hex
(`0x…`) addresses are compared case-insensitively (EIP-55 checksum), every other
encoding (Base58, Bech32, …) exactly — so a real mismatch on a case-sensitive
network is never reported as `verified`.

## Why dependencies are injected

`features/**` packages must not import legacy in-repo `@ledgerhq/*` libs (the
`enforce-boundaries` CI check forbids it), and this intent must stay agnostic of
how any given coin family talks to the device. So instead of importing a signer,
this package declares a structural seam — `StartAddressVerification` — that the
host app (LWD / LWM) fulfils by returning a `VerifyAddressDeviceAction`: an
observable of **normalized**, signer-agnostic `VerifyAddressDeviceState` events
(`awaiting-confirmation` / `confirmed` / `refused` / `unsupported`) plus a
`cancel`. The job maps those to its `JobState` union.

The host is free to implement the seam however it wants — a DMK-native signer
kit, or (as LWD / LWM do) the generic `getAddress` resolver run over the DIE's
DMK transport. `getAddressVerification` turns that Promise into the
normalized `{ observable, cancel }` action so each app only owns the
`getAddress` + `DmkCompatTransport` call:

```ts
import { createIntent } from "@features/platform-device-intent";
import {
  getAddressVerification,
  verifyAddressIntentDefinition,
} from "@features/platform-verify-address-intent";

const verifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressComponentLWD,
};

const intent = createIntent(verifyAddressIntentPlatformDefinition, {
  expectedAddress: mainAccount.freshAddress,
  startAddressVerification: ({ dmk, sessionId }) =>
    getAddressVerification(() =>
      getAddress(new DmkCompatTransport(dmk, sessionId), { ...params, verify: true }),
    ),
});
```

## Exports

| Export                                  | Description                                              |
| --------------------------------------- | -------------------------------------------------------- |
| `verifyAddressIntentDefinition`         | Cross-platform `IntentDefinition` (label, flags, job).   |
| `verifyAddressIntentJob`                | The `Job` implementation.                                |
| `VerifyAddressIntentJobState`           | Discriminated union rendered by the platform component.  |
| `VerifyAddressIntentInput`              | Job input: `expectedAddress` + `startAddressVerification`. |
| `StartAddressVerification`              | The host-injected device-operation seam.                 |
| `VerifyAddressDeviceAction`             | Structural shape returned by the injected operation (`observable` + `cancel`). |
| `VerifyAddressDeviceState`              | Normalized device-progress events consumed by the job.   |
| `VerifyAddressIntentPlatformDefinition` | Platform definition alias (adds the renderer).           |
| `VerifyAddressIntent`                   | Runtime intent alias.                                    |
| `getAddressVerification`               | Turns a host `getAddress` Promise into `{ observable, cancel }`, mapping refusal / unsupported errors. |

## Installation

Internal package, available to other workspace packages via:

```json
{
  "dependencies": {
    "@features/platform-verify-address-intent": "workspace:*"
  }
}
```
