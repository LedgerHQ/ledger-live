# @features/flow-device-os-update

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The OS update journey of a Ledger device: What's new, pre-checks, backup of the apps and settings,
OS update and restore. It also provides the journey's entry points: the update banner, the backup
banner and the bootloader prompt.

The engine it runs is `@features/platform-device-os-update`. The resolved updates and the backup
flag are the `@domain/entity-device-os-update` entity.

## Usage

Each app implements `OsUpdatePorts` and mounts `OsUpdatePortsProvider` around the flow. The flow
takes navigation as callbacks.

```tsx
import { OsUpdatePortsProvider } from "@features/flow-device-os-update";
import { OsUpdateFlow } from "@features/flow-device-os-update/native";

<OsUpdatePortsProvider ports={ports}>
  <OsUpdateFlow device={device} mode={mode} onClose={goBack} onReconnect={resetToMyLedger} />
</OsUpdatePortsProvider>;
```

The root entry exports the types, `OsUpdatePortsProvider` and the URLs. The views are native for
now, so they come from `@features/flow-device-os-update/native`:

| Export (`./native`) | Renders |
| --- | --- |
| `OsUpdateFlow` | The whole journey: What's new, then the update run. |
| `OsUpdateStep`, `CloseConfirmation` | The update run's screens and sheets, to render with the `OsUpdatesOrchestrator` of `@features/platform-device-os-update` when the caller brings its own session and intro. |
| `OsUpdateBanner`, `BackupBanner`, `BootloaderDiscovered` | The entry points, composed by the app with its own state and navigation. |

## Ports

| Port | Provides |
| --- | --- |
| `dmk`, `backupStorage` | The app's DMK instance, and where device backups are stored. |
| `getDeviceModel` | What the views and analytics show of a device model: product name, device-action animation, analytics model id, icon. |
| `getLastSeenOsVersion` | The OS version last seen on a device of this model. |
| `keepScreenAwake` | Keeps the screen awake while the update runs. |
| `openUrl`, `openSupport` | Opens the release notes and Ledger support. |
| `renderReleaseNotes` | Renders the release notes markdown. |

## Layout

| Folder | Holds |
| --- | --- |
| `screens/<ScreenName>/` | The journey's screens: view model and views. |
| `components/` | Components shared by several screens: entry points, sheets, step layout. |
| `components/OsUpdateStep/` | Renders one step of the run: `descriptors/` picks the screen and sheet for each engine state, the views render them. |
| `hooks/` | Ports and tracking providers, finishing progress, device presentation. |
| `analytics/` | Analytics event model and builders. `analyticsPlatform.ts` holds the `platform` sent with every event. |
| `utils/` | URLs and test fixtures. |
| `types/` | One file per type: the ports, the device, the flow mode, the step descriptors. |

View models and routing are shared; views are per platform (`*.native.tsx`).
