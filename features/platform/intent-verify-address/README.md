# @features/platform-intent-verify-address

> [!CAUTION]
> **Status: UNSTABLE** — part of the Device Intent Executor (DIE) rollout; API may change.

Cross-platform [Device Intent](../device-intent/README.md) that verifies a
receive address on the device Secure Screen.

## What it does

The job hands the live DMK session to a **host-injected** device operation and
maps its device-action stream to a small, UI-friendly state union:

| `JobState`         | Meaning                                                       | Terminal |
| ------------------ | ------------------------------------------------------------- | -------- |
| `verifying`        | App is open, the address is being requested from the device.  | no       |
| `addressDisplayed` | First device request that is not the app-and-version query.  | no       |
| `verified`         | Device address matches the expected one.                      | yes      |
| `mismatch`         | Device address differs from the expected one.                 | yes      |
| `cancelled`        | User refused on device. Carries a `retry()` handler.          | no       |
| `unsupported`      | Device app cannot display the address.                        | yes      |

Each attempt emits `verifying` then, once a request that is not the BOLOS
app-and-version query (CLA `0xB0`, INS `0x01`) is sent to the device,
`addressDisplayed` once; a retry after `cancelled` starts the sequence again.
`addressDisplayed` is not a read of the Secure Screen: the legacy `getAddress` is a
single Promise with no "address on screen" event, so this request is the closest
signal. A failure before it (for example `unsupported`) never emits
`addressDisplayed`.

Any other device failure escapes as an observable error, so the executor renders
its shared intent-error screen.

## Result

`JobState` is for the intent UI only. The job reports how the verification ended
as a `VerifyAddressIntentResult` through the DIE `onResult` callback, which a host
reads with `createIntent(definition, input, { onResult })`:

| `Result`      | Reported when                                     |
| ------------- | ------------------------------------------------- |
| `verified`    | The device address matches the expected one.      |
| `mismatch`    | The device address differs from the expected one. |
| `unsupported` | The device app cannot display the address.        |
| `refused`     | The user refused on the device, on each refusal.  |

A retry after `refused` can report another result: the last one reported is the
ending. A job error reports none.

`verified` vs `mismatch` is decided by an **encoding-aware** comparison: hex
(`0x…`) addresses are compared case-insensitively (EIP-55 checksum), every other
encoding (Base58, Bech32, …) exactly — so a real mismatch on a case-sensitive
network is never reported as `verified`.

## Cancelling

`cancel` and unsubscribing abort the signal `getAddressVerification` gives the host.
The host then does not start a `getAddress` still being prepared, and
`notifyOnDeviceRequest` rejects the signer's later requests and cancels a running
DMK signer kit device action. A legacy APDU already sent cannot be recalled, so a
host keeps its executor non-dismissable during `verifying` and `addressDisplayed`.

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
`getAddress` + `DmkCompatTransport` call. It emits `awaiting-confirmation` only
when the host calls the `onDeviceRequest` callback it receives, and passes the
host an `AbortSignal`. `notifyOnDeviceRequest` wraps the DMK so that callback runs
on the first APDU (`DmkCompatTransport`), command or device action (DMK signer
kits) that is not the app-and-version query, and stops requests once the signal
aborts:

```ts
import { createIntent } from "@features/platform-device-intent";
import {
  getAddressVerification,
  notifyOnDeviceRequest,
  verifyAddressIntentDefinitionWithResult,
} from "@features/platform-intent-verify-address";

const verifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinitionWithResult,
  component: VerifyAddressComponentLWD,
};

const intent = createIntent(verifyAddressIntentPlatformDefinition, {
  expectedAddress: mainAccount.freshAddress,
  startAddressVerification: ({ dmk, sessionId }) =>
    getAddressVerification(async (onDeviceRequest, signal) => {
      const options = await getOptions();
      if (signal.aborted) throw new Error("Cancelled before the device request");

      const device = notifyOnDeviceRequest(dmk, onDeviceRequest, signal);
      return getAddress(new DmkCompatTransport(device, sessionId), options);
    }),
}, { onResult });
```

## Exports

| Export                                  | Description                                              |
| --------------------------------------- | -------------------------------------------------------- |
| `verifyAddressIntentDefinitionWithResult` | Cross-platform `IntentDefinition` (label, flags, job) reporting the `Result`. |
| `verifyAddressIntentDefinition`         | The same intent for a host that ignores the `Result`.    |
| `verifyAddressIntentJob`                | The `Job` implementation.                                |
| `VerifyAddressIntentJobState`           | Discriminated union rendered by the platform component.  |
| `VerifyAddressIntentResult`             | How the verification ended, reported through `onResult`. |
| `VerifyAddressIntentInput`              | Job input: `expectedAddress` + `startAddressVerification`. |
| `StartAddressVerification`              | The host-injected device-operation seam.                 |
| `VerifyAddressDeviceAction`             | Structural shape returned by the injected operation (`observable` + `cancel`). |
| `VerifyAddressDeviceState`              | Normalized device-progress events consumed by the job.   |
| `VerifyAddressIntentPlatformDefinition` | Platform definition alias (adds the renderer). Takes `ExtraProps` and `Result`. |
| `VerifyAddressIntent`                   | Runtime intent alias. Takes `ExtraProps` and `Result`.   |
| `getAddressVerification`               | Turns a host `getAddress` Promise into `{ observable, cancel }`, mapping refusal / unsupported errors, with an `AbortSignal`. |
| `notifyOnDeviceRequest`                | Wraps a DMK so a callback runs on the first device request that is not the app-and-version query, and stops requests once the signal aborts. |

## Installation

Internal package, available to other workspace packages via:

```json
{
  "dependencies": {
    "@features/platform-intent-verify-address": "workspace:*"
  }
}
```
