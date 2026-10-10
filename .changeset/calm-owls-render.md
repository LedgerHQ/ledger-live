---
"@ledgerhq/live-dmk-shared": patch
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

Use the real components in the OS updates orchestrator debug screen

Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update
