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
  - The optional `onTrack` gets an `UpdateOfferEvent` when a sheet shows and each time the user
    answers it, so the consumer can send its own analytics. A sheet that shows again after
    `suspendSheets` hid it is not reported again.
- `useConfirmSkipAfterUpdateScreen({ returnsWithoutUpdate, recheckingUpdate })`: true once the
  count of returns from the update screen without updating goes up, until the re-offered update is
  answered.
- `UpdateOfferSheetsProps`, `OfferedUpdate`, `UpdateOfferSheet`, `UpdateOfferEvent`,
  `UpdateScreenReturnInput`: the types.

`@features/flow-device-onboarding-update-offer/testing` exports `updateOfferTestIds` for consumers' tests.

The copy lives under `deviceOnboarding.setup.updateOffer` in the mobile catalog.

## Consumers

The setup screen of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
