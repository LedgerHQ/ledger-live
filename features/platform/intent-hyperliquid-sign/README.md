# @features/platform-intent-hyperliquid-sign

> [!CAUTION]
> **Status: UNSTABLE** — part of the Device Intent Executor (DIE) rollout; API may change.

Cross-platform [Device Intent](../device-intent/README.md) that signs Hyperliquid actions
(orders, cancels, leverage updates, builder fee approvals, …) in the Hyperliquid device app. It
backs the Perps live app's `custom.perps.signActions` request in LWM and LWD.

## What it does

The executor connects a supported device (`HYPERLIQUID_DEVICE_CONNECTION_PARAMS`, which refuses
Nano S at device selection) and opens the Hyperliquid app (Phase 2). The job then hands the live
DMK session to a **host-injected** signer and reports one outcome:

| `JobState` | `Result`                | Meaning                                       | Terminal |
| ---------- | ----------------------- | --------------------------------------------- | -------- |
| `signing`  | —                       | Actions are on the device, awaiting the user. | no       |
| `signed`   | `signed { signatures }` | The device returned one signature per action. | yes      |
| `refused`  | `refused { error }`     | The user refused on the device.               | yes      |
| `error`    | `failed { error }`      | Any other failure, normalized to an `Error`.  | yes      |

`signing` carries the connected device's DMK model id and name for the renderer.

Each outcome is reported once through `onResult`, then the job completes. A refusal stays
terminal: the live app decides whether to send the request again. A device disconnection escapes
as an observable error, so the executor shows its reconnect screen and runs the job again.

A refusal is recognised by its `UserRefusedOnDevice` name, not with `instanceof`, which fails
across duplicated error boundaries. A DMK `{ _tag }` error object becomes an `Error` whose message
is the tag.

## Why the signer is injected

`features/**` packages must not import legacy in-repo `@ledgerhq/*` libs. Signing needs the CAL
`perps_data` certificate, the live app's signed metadata and `DmkSignerHyperliquid`, which all
live there. So this package declares a structural seam, `SignHyperliquidActionsOnSession`, and
the host app fulfils it through `useHyperliquidSignOrchestration` from
`@features/platform-intent-hyperliquid-sign/react`:

```ts
import { useHyperliquidSignOrchestration } from "@features/platform-intent-hyperliquid-sign/react";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";

const { deviceInitializationInput, intent, onIntentJobComplete, onUserCancel } =
  useHyperliquidSignOrchestration({
    request,
    platformDefinition: hyperliquidSignIntentLWDDefinition,
    buildDeviceInitializationInput,
    onClose,
  });
```

## Exports

### `@features/platform-intent-hyperliquid-sign`

| Export                                    | Description                                                |
| ----------------------------------------- | ---------------------------------------------------------- |
| `HYPERLIQUID_APP_NAME`                    | `"Hyperliquid"` device app name opened in DIE Phase 2.     |
| `HYPERLIQUID_DEVICE_CONNECTION_PARAMS`    | `DeviceConnectionParams` excluding `DeviceModelId.NANO_S`. |
| `hyperliquidSignIntentDefinition`         | Cross-platform `IntentDefinition` (label, flags, job).     |
| `hyperliquidSignIntentJob`                | The `Job` implementation.                                  |
| `HyperliquidSignIntentJobState`           | Discriminated union rendered by the platform component.    |
| `HyperliquidSignIntentResult`             | Outcome reported through `onResult`.                       |
| `HyperliquidSignIntentInput`              | Job input: the injected `signOnSession`.                   |
| `SignHyperliquidActionsOnSession`         | The host-injected signer seam.                             |
| `HyperliquidSignSession`                  | Session handed to the signer.                              |
| `HyperliquidSignature`                    | One `{ r, s, v }` signature.                               |
| `HyperliquidSignIntentDefinition`         | Cross-platform definition alias.                           |
| `HyperliquidSignIntentPlatformDefinition` | Platform definition alias (adds the renderer).             |
| `HyperliquidSignIntent`                   | Runtime intent alias.                                      |

### `@features/platform-intent-hyperliquid-sign/react`

| Export                                 | Description                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `useHyperliquidSignOrchestration`      | Shared React orchestration hook wiring `PerpsSignRequest` to DIE props.       |
| `UseHyperliquidSignOrchestrationParams`| Input params for `useHyperliquidSignOrchestration`.                           |
| `HyperliquidSignOrchestration`         | Executor props returned by `useHyperliquidSignOrchestration`.                 |
| `HyperliquidSignOrchestrationRequest`  | Structural request shape (`appOptions`, `signOnSession`, callbacks).          |
| `HyperliquidSignAppOptions`            | Firmware/dependency flags forwarded to `buildDeviceInitializationInput`.      |
| `HyperliquidSignAppRequest`            | `AppRequest` shape handed to `buildDeviceInitializationInput`.                |

## Installation

Internal package, available to other workspace packages via:

```json
{
  "dependencies": {
    "@features/platform-intent-hyperliquid-sign": "workspace:*"
  }
}
```
