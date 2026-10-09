---
"@features/platform-market-countervalues": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

- `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
- Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
- Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.
