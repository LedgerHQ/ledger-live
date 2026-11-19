import { seededPages } from "@features/platform-device-onboarding-analytics";
import { seededChecksPage } from "./seededChecksPage";

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
  ] as const)("should map %s to its page", (state, paused, failureKind, page) => {
    expect(seededChecksPage(state, paused, failureKind)).toBe(page);
  });
});
