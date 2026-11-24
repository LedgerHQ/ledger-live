import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { RecoveryKeyStatus, SeedPath } from "@features/platform-device-onboarding";
import { track } from "@shared/analytics";
import { onboardingPages, unseededProps } from "./funnelTracking";
import {
  karaokeScreen,
  karaokes,
  setupPage,
  setupSuccessPages,
  trackKaraokeAdvanced,
  trackUnseededSetupFinished,
} from "./unseededTracking";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Pin setup"),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("unseededProps", () => {
  it("should leave the seed configuration out until the device reports the path", () => {
    expect(unseededProps(DeviceModelId.STAX, null)).toEqual({
      sourceFlow: "onboarding",
      "onboarding type": "unseeded device",
      deviceModelId: "stax",
    });
  });

  it.each([
    [SeedPath.NewSeed, "new_seed"],
    [SeedPath.RestorePhrase, "restore_seed"],
    [SeedPath.RecoveryKey, "restore_seed"],
    [SeedPath.Recover, "recover_seed"],
  ])("should send the %s path as %s", (seedPath, seedConfiguration) => {
    expect(unseededProps(DeviceModelId.STAX, seedPath)).toMatchObject({ seedConfiguration });
  });
});

describe("setupPage", () => {
  it.each([
    ["deviceSetup.naming", "Device Name"],
    ["deviceSetup.pin", "Pin setup"],
    ["deviceSetup.setupChoice", "Choice of setup"],
    ["deviceSetup.newSeed", "Secret Recovery Phrase - Start"],
    ["deviceSetup.backupRecoveryKey", "Ledger Recovery key setup - Start"],
    ["deviceSetup.restoreChoice", "Restore - choice of setup"],
    ["deviceSetup.restoreWords", "Restore - Secret Recovery Phrase - Start"],
    ["deviceSetup.restoreRecoveryKey", "Restore - Ledger Recovery Key - Start"],
    ["deviceSetup.restoreRecover", "Restore - Ledger Recover"],
    ["deviceSetup.waiting", null],
    ["deviceLocked", null],
  ])("should show %s as %s", (state, page) => {
    expect(setupPage(state)).toBe(page);
  });
});

describe("setupSuccessPages", () => {
  it("should close a new seed with the Recovery Key result when it was offered", () => {
    expect(setupSuccessPages(SeedPath.NewSeed, RecoveryKeyStatus.Ready, true)).toEqual([
      onboardingPages.newSeedSuccess,
      onboardingPages.recoveryKeySuccess,
    ]);
    expect(setupSuccessPages(SeedPath.NewSeed, RecoveryKeyStatus.Rejected, true)).toEqual([
      onboardingPages.newSeedSuccess,
      onboardingPages.recoveryKeyRejected,
    ]);
  });

  it.each([
    [RecoveryKeyStatus.Ready, onboardingPages.recoveryKeySuccess],
    [RecoveryKeyStatus.Rejected, onboardingPages.recoveryKeyRejected],
  ])(
    "should send the %s Recovery Key result even when polling missed the backup step",
    (status, page) => {
      expect(setupSuccessPages(SeedPath.NewSeed, status, false)).toEqual([
        onboardingPages.newSeedSuccess,
        page,
      ]);
    },
  );

  it("should close a new seed alone when the device offers no Recovery Key", () => {
    expect(setupSuccessPages(SeedPath.NewSeed, null, false)).toEqual([
      onboardingPages.newSeedSuccess,
    ]);
  });

  it("should close each restore with its own success page", () => {
    expect(setupSuccessPages(SeedPath.RestorePhrase, null, false)).toEqual([
      onboardingPages.restorePhraseSuccess,
    ]);
    expect(setupSuccessPages(SeedPath.RecoveryKey, null, false)).toEqual([
      onboardingPages.restoreRecoveryKeySuccess,
    ]);
    expect(setupSuccessPages(SeedPath.Recover, null, false)).toEqual([]);
  });
});

describe("events", () => {
  const props = unseededProps(DeviceModelId.STAX, SeedPath.NewSeed);

  it("should open the karaoke on its first phrase", () => {
    expect(karaokeScreen(karaokes.intro, props, 4)).toEqual({
      category: "Unseeded - Karaoke intro",
      ...props,
      karaokeType: "unseeded-intro",
      phraseIndex: 1,
      phraseCount: 4,
    });
  });

  it("should count the shown phrase from 1", () => {
    trackKaraokeAdvanced(karaokes.recover, props, 1, 3);

    expect(track).toHaveBeenCalledWith("karaoke_advanced", {
      source: "Pin setup",
      ...props,
      karaokeType: "Ledger Recover",
      phraseIndex: 2,
      phraseCount: 3,
      page: "Karaoke Ledger Recover",
    });
  });

  it("should send the finished setup with its seed configuration and status", () => {
    trackUnseededSetupFinished(props, {
      ledgerSyncEligible: false,
      firmwareUpdateAvailability: "yes",
    });

    expect(track).toHaveBeenCalledWith("onboarding_device_setup_finished", {
      source: "Pin setup",
      ...props,
      seedConfiguration: "new_seed",
      ledger_sync_eligibility: "no",
      firmware_update_availability: "yes",
    });
  });
});
