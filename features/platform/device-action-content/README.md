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

The light/dark asset is picked from the style provider both apps already mount, via
`useThemeVariant` from [`@features/platform-style`](../style). Callers don't thread the app theme
through, so the component can be dropped into deeply nested `features/` trees. `theme` stays
available as an override (the dev-tool playgrounds use it to preview both variants), and with no
provider mounted it falls back to the light asset rather than throwing, so the component stays
renderable in isolation.

## Usage

```tsx
import { DeviceActionContent, toDeviceActionModelId } from "@features/platform-device-action-content";

<DeviceActionContent
  title="Unlock your device"
  description="Enter your PIN code to continue."
  deviceName="Ledger Flex CDA1"
  deviceModelId={toDeviceActionModelId(deviceModelId)}
  action="power-and-unlock"
/>
```
