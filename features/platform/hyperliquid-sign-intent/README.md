# @features/platform-hyperliquid-sign-intent

> [!CAUTION]
> **Status: UNSTABLE** — part of the Device Intent Executor (DIE) rollout; API may change.

Cross-platform [Device Intent](../device-intent/README.md) that signs Hyperliquid actions
(orders, cancels, leverage updates, builder fee approvals, …) in the Hyperliquid device app. It
backs the Perps live app's `custom.perps.signActions` request in LWM and LWD.

## What it does

The executor connects the device and opens the Hyperliquid app (Phase 2). The job then hands the
live DMK session to a **host-injected** signer and reports one outcome:

| `JobState` | `Result`                | Meaning                                                  | Terminal |
| ---------- | ----------------------- | -------------------------------------------------------- | -------- |
| `signing`  | —                       | Actions are on the device, awaiting the user.            | no       |
| `signed`   | `signed { signatures }` | The device returned one signature per action.            | yes      |
| `refused`  | `refused { error }`     | The user refused on the device.                          | yes      |
| `error`    | `failed { error }`      | Any other failure, normalized to an `Error`.             | yes      |

`signing` carries the connected device's DMK model id and name for the renderer.

Each outcome is reported once through `onResult`, then the job completes. A refusal stays
terminal: the live app decides whether to send the request again. A device disconnection escapes
as an observable error, so the executor shows its reconnect screen and runs the job again.

A refusal is recognised by its `UserRefusedOnDevice` name, not with `instanceof`, which fails
across duplicated `@ledgerhq/errors` copies. A DMK `{ _tag }` error object becomes an `Error`
whose message is the tag.

## Why the signer is injected

`features/**` packages must not import legacy in-repo `@ledgerhq/*` libs. Signing needs the CAL
`perps_data` certificate, the live app's signed metadata and `DmkSignerHyperliquid`, which all
live there. So this package declares a structural seam, `SignHyperliquidActionsOnSession`, and
the host app fulfils it with the `signOnSession` callback live-common hands to the
`signing.execute` UI hook:

```ts
import { createIntent } from "@features/platform-device-intent";
import { hyperliquidSignIntentDefinition } from "@features/platform-hyperliquid-sign-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

const hyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: HyperliquidSignIntentComponentLWD,
};

const intent = createIntent(
  hyperliquidSignIntentPlatformDefinition,
  {
    signOnSession: async ({ dmk, sessionId, connectedDevice }) => {
      const deviceModelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
      const { signatures } = await request.signOnSession({ dmk, sessionId, deviceModelId });
      return signatures;
    },
  },
  { onResult: result => (outcomeRef.current = result) },
);
```

## Exports

| Export                                    | Description                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| `hyperliquidSignIntentDefinition`         | Cross-platform `IntentDefinition` (label, flags, job). |
| `hyperliquidSignIntentJob`                | The `Job` implementation.                              |
| `HyperliquidSignIntentJobState`           | Discriminated union rendered by the platform component. |
| `HyperliquidSignIntentResult`             | Outcome reported through `onResult`.                   |
| `HyperliquidSignIntentInput`              | Job input: the injected `signOnSession`.               |
| `SignHyperliquidActionsOnSession`         | The host-injected signer seam.                         |
| `HyperliquidSignSession`                  | Session handed to the signer.                          |
| `HyperliquidSignature`                    | One `{ r, s, v }` signature.                           |
| `HyperliquidSignIntentPlatformDefinition` | Platform definition alias (adds the renderer).         |
| `HyperliquidSignIntent`                   | Runtime intent alias.                                  |

## Installation

Internal package, available to other workspace packages via:

```json
{
  "dependencies": {
    "@features/platform-hyperliquid-sign-intent": "workspace:*"
  }
}
```
