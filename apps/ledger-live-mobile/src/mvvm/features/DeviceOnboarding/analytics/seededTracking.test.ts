import type { DeviceOnboardingContext } from "@features/platform-device-onboarding";
import { recordAnalytics } from "./recordAnalytics.testUtils";
import {
  seededChecksPage,
  seededExitResult,
  seededFunnel,
  seededPages,
  toFirmwareUpdateAvailability,
} from "./seededTracking";

const shared = {
  sourceFlow: "onboarding",
  "onboarding type": "seeded device",
  seedConfiguration: "already_seeded",
  deviceType: "stax",
};

const events = recordAnalytics();

beforeEach(() => {
  seededFunnel.reset();
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
    [null, "unknown"],
    ["checked", "no"],
    ["offered", "yes"],
  ] as const)("reads %s as %s", (check, expected) => {
    expect(toFirmwareUpdateAvailability(check)).toBe(expected);
  });
});

describe("seededExitResult", () => {
  const exit = (seeded: boolean, genuine: boolean, firmwareVersion: string | null = "1.0.0") =>
    ({
      isOnboarded: seeded,
      deviceModelId: "stax",
      firmwareVersion,
      sessionId: "s1",
      genuineVerdict: genuine ? { sessionId: "s1", isGenuine: true } : null,
    }) as unknown as DeviceOnboardingContext;

  it.each([
    ["completed", exit(true, true), "done"],
    ["offerLedgerSync", exit(true, true), "syncOffer"],
    ["resumeFirmwareUpdate", exit(true, true), "aborted"],
    ["userQuit", exit(true, true), "done"],
    ["userQuit", exit(true, false), "aborted"],
    ["legacyFallback", exit(false, false), "legacyFlow"],
    ["legacyFallback", exit(true, true, null), "done"],
    ["legacyFallback", exit(true, false, null), "legacyFlow"],
    ["legacyFallback", exit(true, false), "aborted"],
  ] as const)("ends %s as %s", (reason, context, result) => {
    expect(seededExitResult(reason, context)).toBe(result);
  });
});

describe("seededFunnel", () => {
  it("sends nothing until the device is known to be seeded", async () => {
    seededFunnel.page(seededPages.genuineCheck);
    seededFunnel.click("close");
    seededFunnel.end("aborted");

    expect(await events()).toEqual([]);
  });

  it("sends the start before the end, with what the funnel learned", async () => {
    seededFunnel.learn({ seeded: true, deviceType: "stax", ledgerSyncEligible: true });
    seededFunnel.page(seededPages.genuineCheck);
    seededFunnel.learn({ firmwareUpdateDone: true });

    seededFunnel.end("done", true);
    seededFunnel.end("aborted");

    expect((await events()).slice(1)).toEqual([
      [
        "onboarding_started",
        {
          ...shared,
          page: seededPages.genuineCheck,
          ledger_sync_eligibility: "yes",
          firmware_update_availability: "unknown",
        },
      ],
      [
        "onboarding_done",
        {
          ...shared,
          page: seededPages.genuineCheck,
          ledger_sync_done: "yes",
          firmware_update_done: "yes",
        },
      ],
    ]);
  });
});
