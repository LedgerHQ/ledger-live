# @features/flow-device-onboarding-setup-stage

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The stepper of the unseeded device setup screen in Ledger Wallet Mobile: which steps a device goes
through, in which order, and the card that shows the current one ("3/5 PIN creation").

The order follows the device. Touchscreens name the device before the PIN. Nanos ask no name and
ask the setup choice before the PIN. An unseeded Nano X 2.2.0–2.7.0 or Nano S Plus 1.1.0–1.6.0 can
only update its OS once seeded: it checks the genuine alone first and the OS version last, in five
steps.

## Exports

- `toSetupStage(input)`: the stage of a device onboarding machine state, or `null` when the screen
  keeps the previous one. `updateAfterSetup` picks the five-step Nano layout, and `osCheck` maps the
  checks after setup to its last step.
- `SetupStepper`: the stepper card of a stage, with its progress and wording.
- `SetupStage`, `SetupStageKind`, `SetupIndicator`, `SetupStageDetail`, `SetupStepperProps`: the
  types.

The copy lives under `deviceOnboarding.setup` in the mobile catalog.

## Consumers

The setup screen of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
