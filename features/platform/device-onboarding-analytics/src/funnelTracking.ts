import { getPreviousTrackingPage, track, trackPage } from "@shared/analytics";
import { SeedPath, type DeviceOnboardingContext } from "@features/platform-device-onboarding";

export type TrackingProps = Readonly<Record<string, string | number>>;

/** The device model, as the machine context holds it. It becomes a string only in the payload. */
export type DeviceModelId = DeviceOnboardingContext["deviceModelId"];

export const onboardingPages = {
  genuineCheck: "Genuine Check",
  genuineCheckStarted: "Genuine Check started",
  genuineCheckRefused: "Genuine Check refused on device",
  genuineCheckError: "Genuine Check error",
  genuineCheckSuccess: "Genuine Check success",
  checkOsVersion: "Check OS version",
  osUpdateRequired: "OS update required",
  osUpdateRefusal: "OS update required refusal screen",
  osUpdateUnsupported: "Drawer : OS update unsupported",
  checksSuccess: "Genuine Check & OS success",
  ledgerSync: "Ledger Sync",
  ledgerSyncRefused: "Ledger Sync Refused",
  ledgerSyncSuccess: "Ledger Sync Success",
  introKaraoke: "Unseeded - Karaoke intro",
  deviceName: "Device Name",
  pinSetup: "Pin setup",
  setupChoice: "Choice of setup",
  newSeedStart: "Secret Recovery Phrase - Start",
  newSeedSuccess: "Secret Recovery Phrase - Success",
  recoveryKeyStart: "Ledger Recovery key setup - Start",
  recoveryKeyRejected: "Ledger Recovery key - Rejected",
  recoveryKeySuccess: "Ledger Recovery key - Success",
  restoreChoice: "Restore - choice of setup",
  restorePhraseStart: "Restore - Secret Recovery Phrase - Start",
  restorePhraseSuccess: "Restore - Secret Recovery Phrase - Success",
  restoreRecoveryKeyStart: "Restore - Ledger Recovery Key - Start",
  restoreRecoveryKeySuccess: "Restore - Ledger Recovery Key - Success",
  restoreRecover: "Restore - Ledger Recover",
  recoverKaraoke: "Karaoke Ledger Recover",
  recoverOnboarding: "Ledger Recover Onboarding",
  recoverSheet: "Ledger Recover bottom sheet",
} as const;

export type OnboardingPage = (typeof onboardingPages)[keyof typeof onboardingPages];

export type ScreenTracking = Readonly<{ category: OnboardingPage }> & TrackingProps;

export const onboardingButtons = {
  initiateGenuineCheck: "Initiate Genuine Check",
  retryGenuineCheck: "Retry genuine check",
  continue: "Continue",
  installUpdate: "Install Ledger OS update",
  skipUpdate: "Skip Ledger OS update",
  activateSync: "Activate sync",
  skip: "Skip",
  learnMore: "Learn more",
  enableSync: "Enable sync",
  yesSkip: "Yes, skip",
  close: "close",
  startSetup: "Start my setup",
  protectWithRecover: "Protect my wallet",
  skipRecover: "Skip for now",
} as const;

export type OnboardingButton = (typeof onboardingButtons)[keyof typeof onboardingButtons];

type OnboardingType = "seeded device" | "unseeded device";

type SeedConfiguration = "already_seeded" | "new_seed" | "restore_seed" | "recover_seed";

/** The properties every event of one onboarding funnel carries. */
export type FunnelProps = Readonly<
  {
    sourceFlow: "onboarding";
    "onboarding type": OnboardingType;
    deviceType: string;
  } & Record<string, string>
>;

export function seededProps(deviceModelId: DeviceModelId): FunnelProps {
  return {
    sourceFlow: "onboarding",
    "onboarding type": "seeded device",
    seedConfiguration: "already_seeded",
    deviceType: deviceModelId,
  };
}

/** `seedConfiguration` is set once the device reports the setup path. */
export function unseededProps(
  deviceModelId: DeviceModelId,
  seedPath: SeedPath | null,
): FunnelProps {
  const seedConfiguration = toSeedConfiguration(seedPath);
  return {
    sourceFlow: "onboarding",
    "onboarding type": "unseeded device",
    ...(seedConfiguration ? { seedConfiguration } : {}),
    deviceType: deviceModelId,
  };
}

const seedConfigurationByPath = {
  [SeedPath.NewSeed]: "new_seed",
  [SeedPath.RestorePhrase]: "restore_seed",
  [SeedPath.RecoveryKey]: "restore_seed",
  [SeedPath.Recover]: "recover_seed",
} as const satisfies Record<SeedPath, SeedConfiguration>;

function toSeedConfiguration(seedPath: SeedPath | null): SeedConfiguration | null {
  return seedPath ? seedConfigurationByPath[seedPath] : null;
}

export function onboardingScreen(
  page: OnboardingPage,
  props: FunnelProps,
  extraProps: TrackingProps = {},
): ScreenTracking {
  return { category: page, ...props, ...extraProps };
}

export function withSource<T extends object>(props: T): T & { source?: string } {
  const source = getPreviousTrackingPage();
  return source ? { source, ...props } : props;
}

export function trackOnboardingPage(
  page: OnboardingPage,
  props: FunnelProps,
  extraProps: TrackingProps = {},
): void {
  trackPage(
    { category: page, props: { ...props, ...extraProps } },
    { updateRoutes: true, refreshSource: true },
  );
}

export function trackOnboardingClick(
  button: OnboardingButton,
  props: FunnelProps,
  extraProps: TrackingProps = {},
): void {
  track("button_clicked", withSource({ ...props, ...extraProps, button }));
}
