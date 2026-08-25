# @features/platform-device-action-content

> [!CAUTION]
> **Status: UNSTABLE** — New package; migrated out of apps/\* as a tech enabler, API may still change.

Shared "device-side action" content for web and native: an animation, optional device label,
optional title/description, and an optional banner, used while waiting for the user to act on
their Ledger device (unlock, continue in an app, etc.).

## Exports

| Export | Description |
| --- | --- |
| `DeviceActionContent` | Renders the animation, device label, copy, and banner |
| `DeviceActionContentProps` | Component props |
| `DeviceActionModelId` | Device models with a device-action animation (excludes `blue`) |
| `toDeviceActionModelId` | Narrows a raw device model id string to `DeviceActionModelId`, or `null` if unsupported |
| `supportedDeviceActionModelIds` | All `DeviceActionModelId` values |

This package never imports `DeviceModelId` from `@ledgerhq/types-devices` — that's a legacy
`libs/` type forbidden in `features/`, `domain/`, and `shared/` (see
[docs/ddd-monorepo-architecture.md](../../../docs/ddd-monorepo-architecture.md)). Callers convert
their `DeviceModelId` with `toDeviceActionModelId` before passing it in.

`theme` is a required prop — this package never reaches for ambient app theme context, so the
caller resolves and passes the current light/dark theme explicitly.

## Usage

```tsx
import { DeviceActionContent, toDeviceActionModelId } from "@features/platform-device-action-content";

<DeviceActionContent
  title="Unlock your device"
  description="Enter your PIN code to continue."
  deviceName="Ledger Flex CDA1"
  deviceModelId={toDeviceActionModelId(deviceModelId)}
  action="power-and-unlock"
  theme="dark"
/>
```
