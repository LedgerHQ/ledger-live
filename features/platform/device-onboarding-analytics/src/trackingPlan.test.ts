import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { SeedPath } from "@features/platform-device-onboarding";
import { track, trackPage } from "@shared/analytics";
import {
  karaokes,
  onboardingButtons,
  onboardingPages,
  seededProps,
  trackKaraokeAdvanced,
  trackKaraokeCompleted,
  trackKaraokePage,
  trackOnboardingClick,
  trackOnboardingPage,
  trackRecoverOffered,
  trackSeededAborted,
  trackSeededDone,
  trackSeededStarted,
  trackUnseededDone,
  trackUnseededSetupFinished,
  trackUnseededStarted,
  unseededProps,
  type SeededResult,
  type UnseededStatus,
} from "./index";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Previous page"),
}));

const result: SeededResult = {
  deviceType: DeviceModelId.STAX,
  ledgerSyncEligible: true,
  firmwareUpdateAvailability: "no",
  firmwareUpdateStarted: false,
  firmwareUpdateDone: false,
};

const status: UnseededStatus = { ledgerSyncEligible: true, firmwareUpdateAvailability: "no" };

beforeEach(() => {
  jest.clearAllMocks();
});

/** One line per event: its name, then its property names. A change here is a tracking plan change. */
function sentPlan(): string[] {
  const pages = jest
    .mocked(trackPage)
    .mock.calls.map(([page]) => `Page ${page.category} | ${keys(page.props)}`);
  const events = jest.mocked(track).mock.calls.map(([event, props]) => {
    const button = props && "button" in props ? ` "${String(props.button)}"` : "";
    return `${event}${button} | ${keys(props)}`;
  });
  return [...pages, ...events];
}

function milestone(seed: string): string {
  return `deviceType, firmware_update_availability, ledger_sync_eligibility, onboarding type, ${seed}source, sourceFlow`;
}

function keys(props: object | null | undefined): string {
  return Object.keys(props ?? {})
    .sort()
    .join(", ");
}

describe("onboarding tracking plan", () => {
  it("should keep the page names of the specs", () => {
    expect(Object.values(onboardingPages)).toEqual([
      "Genuine Check",
      "Genuine Check started",
      "Genuine Check refused on device",
      "Genuine Check error",
      "Genuine Check success",
      "Check OS version",
      "OS update required",
      "OS update required refusal screen",
      "Drawer : OS update unsupported",
      "Genuine Check & OS success",
      "Ledger Sync",
      "Ledger Sync Refused",
      "Ledger Sync Success",
      "Unseeded - Karaoke intro",
      "Device Name",
      "Pin setup",
      "Choice of setup",
      "Secret Recovery Phrase - Start",
      "Secret Recovery Phrase - Success",
      "Ledger Recovery key setup - Start",
      "Ledger Recovery key - Rejected",
      "Ledger Recovery key - Success",
      "Restore - choice of setup",
      "Restore - Secret Recovery Phrase - Start",
      "Restore - Secret Recovery Phrase - Success",
      "Restore - Ledger Recovery Key - Start",
      "Restore - Ledger Recovery Key - Success",
      "Restore - Ledger Recover",
      "Karaoke Ledger Recover",
      "Ledger Recover Onboarding",
      "Ledger Recover bottom sheet",
    ]);
  });

  it("should keep the button names of the specs", () => {
    expect(Object.values(onboardingButtons)).toEqual([
      "Initiate Genuine Check",
      "Retry genuine check",
      "Continue",
      "Install Ledger OS update",
      "Skip Ledger OS update",
      "Activate sync",
      "Skip",
      "Learn more",
      "Enable sync",
      "Yes, skip",
      "close",
      "Start my setup",
      "Protect my wallet",
      "Skip for now",
    ]);
  });

  it("should keep the properties of each seeded event", () => {
    const seeded = seededProps(DeviceModelId.STAX);
    trackOnboardingPage(onboardingPages.genuineCheck, seeded);
    trackOnboardingClick(onboardingButtons.continue, seeded);
    trackSeededStarted(result);
    trackSeededDone(result);
    trackSeededAborted(result);

    const shared = "deviceType, onboarding type, seedConfiguration, sourceFlow";
    const end = `deviceType, firmware_update_availability, firmware_update_done, firmware_update_started, ledger_sync_done, onboarding type, seedConfiguration, source, sourceFlow`;
    expect(sentPlan()).toEqual([
      `Page Genuine Check | ${shared}`,
      `button_clicked "Continue" | button, deviceType, onboarding type, seedConfiguration, source, sourceFlow`,
      `onboarding_started | deviceType, ledger_sync_eligibility, onboarding type, seedConfiguration, source, sourceFlow`,
      `onboarding_done | ${end}`,
      `onboarding_aborted | ${end}`,
    ]);
  });

  it("should keep the properties of each unseeded event", () => {
    const beforeChoice = unseededProps(DeviceModelId.STAX, null);
    const afterChoice = unseededProps(DeviceModelId.STAX, SeedPath.NewSeed);
    trackUnseededStarted(beforeChoice, status);
    trackKaraokeAdvanced(karaokes.intro, beforeChoice, 1, 4);
    trackKaraokeCompleted(karaokes.intro, beforeChoice);
    trackOnboardingPage(onboardingPages.pinSetup, beforeChoice);
    trackUnseededSetupFinished(afterChoice, status);
    trackRecoverOffered(afterChoice, status);
    trackKaraokePage(karaokes.recover, afterChoice, 3);
    trackUnseededDone(afterChoice, status, { ledgerSyncDone: true, firmwareUpdateDone: false });

    expect(sentPlan()).toEqual([
      "Page Pin setup | deviceType, onboarding type, sourceFlow",
      "Page Karaoke Ledger Recover | deviceType, karaokeType, onboarding type, phraseCount, phraseIndex, seedConfiguration, sourceFlow",
      `onboarding_started | ${milestone("")}`,
      "karaoke_advanced | deviceType, karaokeType, onboarding type, page, phraseCount, phraseIndex, source, sourceFlow",
      "karaoke_completed | deviceType, karaokeType, onboarding type, source, sourceFlow",
      `onboarding_device_setup_finished | ${milestone("seedConfiguration, ")}`,
      `onboarding_Ledger_Recover | ${milestone("seedConfiguration, ")}`,
      "onboarding_done | deviceType, firmware_update_availability, firmware_update_done, ledger_sync_done, ledger_sync_eligibility, onboarding type, seedConfiguration, source, sourceFlow",
    ]);
  });
});
