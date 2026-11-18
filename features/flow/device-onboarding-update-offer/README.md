# @features/flow-device-onboarding-update-offer

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The OS update sheets Ledger Wallet Mobile shows over the unseeded device setup screen when the
device OS is out of date.

## Exports

- `UpdateOfferSheets`: the "Update OS™ to unlock full functionality" sheet and the "Skip this
  update?" confirmation.
  - The offer's close button opens the confirmation.
  - **Update now** calls `onUpdate`.
  - **Skip anyway**, the close button and a swipe down call `onSkip`.
  - `confirmSkip` opens the confirmation first. `suspendSheets` hides both sheets while another
    sheet takes the screen.
- `useConfirmSkipAfterUpdateScreen({ updateScreenOpen, recheckingUpdate })`: true after the user
  leaves the update screen without updating, until the re-offered update is answered.
- `UpdateOfferSheetsProps`, `OfferedUpdate`, `UpdateScreenReturnInput`: the types.

The copy lives under `deviceOnboarding.setup.updateOffer` in the mobile catalog.

## Consumers

The setup screen of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
