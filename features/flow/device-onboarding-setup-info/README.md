# @features/flow-device-onboarding-setup-info

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The info card of the unseeded device setup screen in Ledger Wallet Mobile. From the setup choice on,
a card above the stepper names the current step; tapping it opens a bottom sheet that explains it.
The card and its sheets are local: they send nothing to the device.

## Exports

- `SetupInfo`: the card and its sheet. Takes the stage's `card` and `suspendSheets`, which hides
  an open sheet while another sheet (device locked, quit confirmation) takes the screen.
- `toSetupInfoCard(machineState, reportsRecoveryKey)`: the card of a device onboarding machine
  state. A device that reports no Recovery Key gets no Recovery Key card.
- `SetupInfoCard`, `SetupInfoProps`: the types.

The copy lives under `deviceOnboarding.setup.info` in the mobile catalog.

## Consumers

The setup screen of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
