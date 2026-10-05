---
"@ledgerhq/live-common": minor
"@ledgerhq/live-dmk-desktop": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

`connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.
