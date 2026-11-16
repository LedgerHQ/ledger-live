# @features/platform-device-os-update

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The OS update engine: it checks whether a device has OS updates, and runs them. It has no screens
and no copy, so any flow that updates a device can use it with its own UI.

## Exports

- The use cases: `OsUpdatesOrchestratorUseCase` (runs the update) and `ResolveOsUpdatesUseCase`
  (checks whether a device has updates), with `executeResolveOsUpdatePath`, the raw device action.
- Their state and input types, and `isOsUpdateSupported`, `hasAnythingToRestore`.
- The React binding: `useOsUpdatesOrchestrator` (runs the orchestrator), `useOsUpdateSteps` (turns
  its progress into step props and the close confirmation), `useResolveOsUpdates`, and the
  `OsUpdatesOrchestrator` component.

## Layout

| Folder                 | Holds                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `state-machines/`      | The orchestrator state machines: pre-checks, create backup, apply updates, restore backup. |
| `use-cases/<UseCase>/` | One folder per use case the other packages call, with its tests and its internal steps.    |
| `types/`               | The step states, the use case inputs and outputs, the `DeviceBackupStorage` port.          |
| `utils/`               | Pure helpers: session lookup, support rules, backup check.                                 |
| `hooks/`               | The React hooks.                                                                           |
| `components/`          | `OsUpdatesOrchestrator`: its view model and view.                                          |

`useResolveOsUpdates` stores the resolved updates and the backup flag in
`@domain/entity-device-os-update`.

## Rendering the orchestrator

`OsUpdatesOrchestrator` runs the update and renders each step with the caller's components:

```tsx
import { OsUpdatesOrchestrator } from "@features/platform-device-os-update";

<OsUpdatesOrchestrator
  dmk={dmk}
  connectedDevice={connectedDevice}
  osUpdates={osUpdates}
  backupStorage={backupStorage}
  renderStep={(props) => <MyStep {...props} />}
  onStop={onStop}
  renderCloseConfirmation={(props) => <MyCloseConfirmation {...props} />}
/>;
```

`renderCloseConfirmation` is optional: without it, closing the run stops it at once instead of
asking for a confirmation.

Return the same component from `renderStep` for every step. A different component per step would
be remounted at each step, and with it the bottom sheet the previous step may still show.
