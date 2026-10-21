---
"@ledgerhq/live-dmk-speculos": minor
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-desktop": minor
"@ledgerhq/live-dmk-mobile": minor
"@ledgerhq/live-e2e-shared": patch
"live-mobile": patch
"ledger-live-mobile-e2e-tests": patch
"ledger-live-desktop-e2e-tests": patch
---

Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.
