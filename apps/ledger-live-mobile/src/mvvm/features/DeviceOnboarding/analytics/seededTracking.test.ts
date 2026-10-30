import { track, trackPage } from "@shared/analytics";
import type { DeviceOnboardingContext } from "@features/platform-device-onboarding";
import {
  seededChecksPage,
  seededPages,
  toFirmwareUpdateAvailability,
  toSeededOutcome,
  trackSeededAborted,
  trackSeededClick,
  trackSeededDone,
  trackSeededPage,
  trackSeededStarted,
  type SeededOutcome,
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

const outcome: SeededOutcome = {
  deviceType: "stax",
  ledgerSyncEligible: true,
  firmwareUpdateAvailability: "no",
  firmwareUpdateDone: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("seededChecksPage", () => {
  it.each([
    ["awaitingStart", false, null, seededPages.genuineCheck],
    ["checks.checksIdle", true, null, seededPages.genuineCheck],
    ["checks.checksIdle", false, null, null],
    ["checks.genuineCheck.running", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineCheck.awaitingApproval", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineFailed", false, "GENUINE_CHECK_REFUSED", seededPages.genuineCheckRefused],
    ["checks.notGenuineSupport", false, "DEVICE_NOT_GENUINE", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "GENUINE_CHECK_FAILED", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "SECURE_CHANNEL_LOST", seededPages.genuineCheckError],
    ["checks.firmwareCheckFailed", false, null, seededPages.genuineCheckError],
    ["checks.firmwareCheck", false, null, seededPages.checkOsVersion],
    ["checks.firmwareUpdateOffered", false, null, seededPages.osUpdateRequired],
    ["checks.checksSucceeded", false, null, seededPages.checksSuccess],
    ["checks.checksDone", false, null, seededPages.checksSuccess],
    ["checks.leavingEarlyCheckScreen", false, null, seededPages.checksSuccess],
    ["syncOffer", false, null, seededPages.checksSuccess],
    ["done", false, null, seededPages.checksSuccess],
    ["checks.firmwareUpdateDelegated", false, null, null],
    ["checks.enteringEarlyCheckScreen", false, null, null],
    ["deviceLocked", false, null, null],
    [null, false, null, null],
  ] as const)("maps %s to its page", (state, paused, failureKind, page) => {
    expect(seededChecksPage(state, paused, failureKind)).toBe(page);
  });
});

describe("toFirmwareUpdateAvailability", () => {
  it.each([
    [null, false, "unknown"],
    ["checked", false, "no"],
    ["offered", false, "yes"],
    [null, true, "yes"],
  ] as const)("reads %s with update done %s as %s", (check, done, expected) => {
    expect(toFirmwareUpdateAvailability(check, done)).toBe(expected);
  });
});

describe("toSeededOutcome", () => {
  const context = (overrides: Partial<DeviceOnboardingContext>) =>
    ({
      onboardedOnEntry: true,
      deviceModelId: "stax",
      offerSync: true,
      firmware: null,
      ...overrides,
    }) as DeviceOnboardingContext;

  it("is null for a device that was not seeded on entry", () => {
    expect(toSeededOutcome(context({ onboardedOnEntry: false }), false)).toBeNull();
  });

  it("reports an unknown update availability before the OS check answers", () => {
    expect(toSeededOutcome(context({}), false)).toEqual({
      deviceType: "stax",
      ledgerSyncEligible: true,
      firmwareUpdateAvailability: "unknown",
      firmwareUpdateDone: false,
    });
  });

  it("reports an accepted update once the machine forgot it", () => {
    expect(toSeededOutcome(context({ firmware: null }), true)).toMatchObject({
      firmwareUpdateAvailability: "yes",
      firmwareUpdateDone: true,
    });
  });
});

describe("events", () => {
  it("tracks a page with the shared properties", () => {
    trackSeededPage(seededPages.ledgerSync, "stax");

    expect(trackPage).toHaveBeenCalledWith(
      { category: "Ledger Sync", props: shared },
      { updateRoutes: true, refreshSource: true },
    );
  });

  it("tracks a click with the page it happens on and that page's source", () => {
    trackSeededClick("Skip", "stax", { page: "Ledger Sync", source: "Pairing" });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      source: "Pairing",
      ...shared,
      button: "Skip",
      page: "Ledger Sync",
    });
  });

  it("leaves the source out when the page has none", () => {
    trackSeededClick("Skip", "stax", { page: "Ledger Sync", source: "" });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      ...shared,
      button: "Skip",
      page: "Ledger Sync",
    });
  });

  it("tracks the start with the eligibility and update availability", () => {
    trackSeededStarted({ ...outcome, firmwareUpdateAvailability: "unknown" });

    expect(track).toHaveBeenCalledWith("onboarding_started", {
      source: "Pairing",
      ...shared,
      ledger_sync_eligibility: "yes",
      firmware_update_availability: "unknown",
    });
  });

  it("tracks done with the Ledger Sync and update results", () => {
    trackSeededDone({ ...outcome, firmwareUpdateDone: true }, true);

    expect(track).toHaveBeenCalledWith("onboarding_done", {
      source: "Pairing",
      ...shared,
      ledger_sync_done: "yes",
      firmware_update_done: "yes",
    });
  });

  it("tracks aborted without Ledger Sync", () => {
    trackSeededAborted(outcome);

    expect(track).toHaveBeenCalledWith("onboarding_aborted", {
      source: "Pairing",
      ...shared,
      ledger_sync_done: "no",
      firmware_update_done: "no",
    });
  });
});
