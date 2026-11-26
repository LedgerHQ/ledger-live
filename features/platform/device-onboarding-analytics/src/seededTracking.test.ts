import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import type { DeviceOnboardingContext } from "@features/platform-device-onboarding";
import {
  onboardingPages,
  seededProps,
  trackOnboardingClick,
  trackOnboardingPage,
} from "./funnelTracking";
import {
  toFirmwareUpdateAvailability,
  toSeededResult,
  trackSeededAborted,
  trackSeededDone,
  trackSeededStarted,
  type SeededResult,
} from "./seededTracking";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Pairing"),
}));

const shared = {
  sourceFlow: "onboarding",
  "onboarding type": "seeded device",
  seedConfiguration: "already_seeded",
  deviceType: "stax",
};

const seeded: SeededResult = {
  deviceType: DeviceModelId.STAX,
  ledgerSyncEligible: true,
  firmwareUpdateAvailability: "no",
  firmwareUpdateStarted: false,
  firmwareUpdateDone: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("toFirmwareUpdateAvailability", () => {
  it.each([
    [null, false, "unknown"],
    ["upToDate", false, "no"],
    ["offered", false, "yes"],
    ["declined", false, "yes"],
    ["skipped", false, "unknown"],
    [null, true, "yes"],
  ] as const)("should read %s with update started %s as %s", (check, started, expected) => {
    expect(toFirmwareUpdateAvailability(check, started)).toBe(expected);
  });
});

const context = (overrides: Partial<DeviceOnboardingContext>) =>
  ({
    onboardedOnEntry: true,
    deviceModelId: DeviceModelId.STAX,
    offerSync: true,
    firmware: null,
    ...overrides,
  }) as DeviceOnboardingContext;

describe("toSeededResult", () => {
  it("should be null when the device was not seeded on entry", () => {
    expect(toSeededResult(context({ onboardedOnEntry: false }), false)).toBeNull();
  });

  it("should report an unknown update availability when the OS check has not answered", () => {
    expect(toSeededResult(context({}), false)).toEqual({
      deviceType: "stax",
      ledgerSyncEligible: true,
      firmwareUpdateAvailability: "unknown",
      firmwareUpdateStarted: false,
      firmwareUpdateDone: false,
    });
  });

  it("should report a started but not done update when the recheck has not answered", () => {
    expect(toSeededResult(context({ firmware: null }), true)).toMatchObject({
      firmwareUpdateAvailability: "yes",
      firmwareUpdateStarted: true,
      firmwareUpdateDone: false,
    });
  });

  it("should report a done update when the recheck says the OS is up to date", () => {
    expect(toSeededResult(context({ firmware: { kind: "upToDate" } }), true)).toMatchObject({
      firmwareUpdateStarted: true,
      firmwareUpdateDone: true,
    });
  });

  it("should not report a done update when the OS was already up to date", () => {
    expect(toSeededResult(context({ firmware: { kind: "upToDate" } }), false)).toMatchObject({
      firmwareUpdateAvailability: "no",
      firmwareUpdateDone: false,
    });
  });
});

describe("events", () => {
  it("should send a page with the shared properties", () => {
    trackOnboardingPage(onboardingPages.ledgerSync, seededProps(DeviceModelId.STAX));

    expect(trackPage).toHaveBeenCalledWith(
      { category: "Ledger Sync", props: shared },
      { updateRoutes: true, refreshSource: true },
    );
  });

  it("should send a click with the previous page as source", () => {
    trackOnboardingClick("Skip", seededProps(DeviceModelId.STAX));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      source: "Pairing",
      ...shared,
      button: "Skip",
    });
  });

  it("should send the start with the Ledger Sync eligibility only", () => {
    trackSeededStarted({ deviceType: DeviceModelId.STAX, ledgerSyncEligible: true });

    expect(track).toHaveBeenCalledWith("onboarding_started", {
      source: "Pairing",
      ...shared,
      ledger_sync_eligibility: "yes",
    });
  });

  it("should send done with the Ledger Sync and update results", () => {
    trackSeededDone(
      {
        ...seeded,
        firmwareUpdateAvailability: "yes",
        firmwareUpdateStarted: true,
        firmwareUpdateDone: true,
      },
      true,
    );

    expect(track).toHaveBeenCalledWith("onboarding_done", {
      source: "Pairing",
      ...shared,
      ledger_sync_done: "yes",
      firmware_update_availability: "yes",
      firmware_update_started: "yes",
      firmware_update_done: "yes",
    });
  });

  it("should send aborted without Ledger Sync", () => {
    trackSeededAborted(seeded);

    expect(track).toHaveBeenCalledWith("onboarding_aborted", {
      source: "Pairing",
      ...shared,
      ledger_sync_done: "no",
      firmware_update_availability: "no",
      firmware_update_started: "no",
      firmware_update_done: "no",
    });
  });
});
