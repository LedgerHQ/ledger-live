---
"@ledgerhq/live-dmk-desktop": minor
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

chore(live-dmk): remove the ldmkTransport feature flag

`DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
and the `isLDMKTransportEnabled` analytics property is removed.
