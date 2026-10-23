import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  track,
  trackPage,
} from "@shared/analytics";
import {
  markFirmwareUpdateAccepted,
  markLedgerSyncDone,
  rememberSeededOnboarding,
  resetSeededOnboardingAnalytics,
  trackSeededChecksSuccess,
  seededButtons,
  seededCheckPage,
  seededPages,
  trackSeededClick,
  trackSeededOnboardingAborted,
  trackSeededOnboardingDone,
  trackSeededOnboardingStarted,
  trackSeededPage,
  seededCallerWins,
} from "./seededTracking";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getCurrentTrackingPage: jest.fn(() => "Page Current"),
  getPreviousTrackingPage: jest.fn(() => "Page Pairing"),
}));

describe("seededCheckPage", () => {
  it.each([
    ["awaitingStart", false, null, seededPages.genuineCheck],
    ["checks.checksIdle", true, null, seededPages.genuineCheck],
    ["checks.checksIdle", false, null, null],
    ["checks.genuineCheck", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineCheck.awaitingApproval", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineFailed", false, "GENUINE_CHECK_REFUSED", seededPages.genuineCheckRefused],
    ["checks.notGenuineSupport", false, "DEVICE_NOT_GENUINE", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "GENUINE_CHECK_FAILED", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "SECURE_CHANNEL_LOST", seededPages.genuineCheckError],
    ["checks.firmwareCheckFailed", false, null, seededPages.genuineCheckError],
    ["checks.firmwareCheck", false, null, seededPages.checkOsVersion],
    ["checks.firmwareCheck.reading", false, null, seededPages.checkOsVersion],
    ["checks.firmwareUpdateOffered", false, null, seededPages.osUpdateRequired],
    ["checks.checksSucceeded", false, null, seededPages.checksSuccess],
    ["checks.checksDone", false, null, seededPages.checksSuccess],
    ["checks.leavingEarlyCheckScreen", false, null, seededPages.checksSuccess],
    ["checks.firmwareUpdateDelegated", false, null, null],
    ["checks.enteringEarlyCheckScreen", false, null, null],
    ["deviceLocked", false, null, null],
    [null, false, null, null],
  ] as const)(
    "should map %s to the seeded page when the machine is in that state",
    (state, paused, failureKind, page) => {
      expect(seededCheckPage(state, paused, failureKind)).toBe(page);
    },
  );
});

describe("seeded onboarding analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeededOnboardingAnalytics();
  });

  it("should wait to start until the OS check has a result", () => {
    rememberSeededOnboarding({ ledgerSyncEligible: true, deviceType: "stax" });

    trackSeededOnboardingStarted();

    expect(track).not.toHaveBeenCalled();

    rememberSeededOnboarding({ firmwareChecked: true });
    trackSeededOnboardingStarted();
    trackSeededOnboardingStarted();

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({
        platform: "lwm",
        sourceFlow: "onboarding",
        seedConfiguration: "already_seeded",
        source: "Page Pairing",
        deviceType: "stax",
        ledger_sync_eligibility: "yes",
        firmware_update_availability: "no",
      }),
      { callerWins: seededCallerWins },
    );
  });

  it("should keep an offered OS update available after the check is stored as done", () => {
    rememberSeededOnboarding({
      updateOffered: true,
      deviceVersion: "1.2.0",
      deviceType: "stax",
    });
    rememberSeededOnboarding({ firmwareChecked: true, updateOffered: false });

    trackSeededOnboardingStarted();

    expect(track).toHaveBeenCalledWith(
      "onboarding_started",
      expect.objectContaining({
        firmware_update_availability: "yes",
        deviceVersion: "1.2.0",
      }),
      { callerWins: seededCallerWins },
    );
  });

  it("should start with no OS update when the user leaves before the check answers", () => {
    trackSeededOnboardingAborted();

    expect(track).toHaveBeenNthCalledWith(
      1,
      "onboarding_started",
      expect.objectContaining({
        ledger_sync_eligibility: "no",
        firmware_update_availability: "no",
      }),
      { callerWins: seededCallerWins },
    );
    expect(track).toHaveBeenNthCalledWith(
      2,
      "onboarding_aborted",
      expect.objectContaining({
        ledger_sync_done: "no",
        firmware_update_done: "no",
        platform: "lwm",
        seedConfiguration: "already_seeded",
        source: "Page Pairing",
      }),
      { callerWins: seededCallerWins },
    );

    trackSeededOnboardingDone();
    trackSeededOnboardingAborted();

    expect(track).toHaveBeenCalledTimes(2);
  });

  it("should complete with sync and the OS update only after this session accepts both", () => {
    rememberSeededOnboarding({
      ledgerSyncEligible: true,
      updateOffered: true,
      deviceType: "stax",
      deviceVersion: "1.2.0",
    });
    trackSeededOnboardingStarted();
    markFirmwareUpdateAccepted();
    markLedgerSyncDone();

    trackSeededOnboardingDone();

    expect(track).toHaveBeenCalledWith(
      "onboarding_done",
      expect.objectContaining({
        ledger_sync_done: "yes",
        firmware_update_done: "yes",
        deviceType: "stax",
        deviceVersion: "1.2.0",
        source: "Page Pairing",
      }),
      { callerWins: seededCallerWins },
    );
    expect(track).toHaveBeenCalledTimes(2);
    expect(jest.mocked(track).mock.calls[1]?.[1]).not.toHaveProperty("deviceName");
    expect(jest.mocked(track).mock.calls[1]?.[1]).not.toHaveProperty("deviceId");
  });

  it("should send the previous page as source on a click", () => {
    trackSeededClick(seededButtons.close, seededPages.genuineCheck);

    expect(getPreviousTrackingPage).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: seededPages.genuineCheck,
        source: "Page Pairing",
        platform: "lwm",
        sourceFlow: "onboarding",
        seedConfiguration: "already_seeded",
      }),
      { callerWins: seededCallerWins },
    );
  });

  it("should omit the page when no seeded screen is current", () => {
    jest.mocked(getCurrentTrackingPage).mockReturnValueOnce("");

    trackSeededClick(seededButtons.close, null);

    expect(jest.mocked(track).mock.calls[0]?.[1]).not.toHaveProperty("page");
  });

  it("should start a later attempt after the session is reset", () => {
    rememberSeededOnboarding({ firmwareChecked: true });
    trackSeededOnboardingStarted();
    trackSeededOnboardingAborted();

    resetSeededOnboardingAnalytics();
    rememberSeededOnboarding({ firmwareChecked: true, deviceType: "nanoX" });
    trackSeededOnboardingStarted();

    expect(track).toHaveBeenLastCalledWith(
      "onboarding_started",
      expect.objectContaining({ deviceType: "nanoX", firmware_update_availability: "no" }),
      { callerWins: seededCallerWins },
    );
  });

  it("should emit the checks success page once", () => {
    trackSeededChecksSuccess();
    trackSeededChecksSuccess();

    expect(trackPage).toHaveBeenCalledTimes(1);
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: seededPages.checksSuccess }),
      expect.anything(),
    );
  });

  it("should emit checks success again after the funnel leaves that page", () => {
    trackSeededChecksSuccess();
    trackSeededPage(seededPages.checkOsVersion);
    trackSeededChecksSuccess();

    const successCalls = jest
      .mocked(trackPage)
      .mock.calls.filter(([payload]) => payload.category === seededPages.checksSuccess);
    expect(successCalls).toHaveLength(2);
  });

  it("should keep the predecessor as the click source after a drawer rewrites it", () => {
    jest.mocked(getCurrentTrackingPage).mockReturnValueOnce(seededPages.genuineCheckStarted);
    jest.mocked(getPreviousTrackingPage).mockReturnValue(seededPages.genuineCheckRefused);

    trackSeededPage(seededPages.genuineCheckRefused);
    trackSeededClick(seededButtons.retryGenuineCheck, seededPages.genuineCheckRefused);
    jest.mocked(getPreviousTrackingPage).mockReturnValue("Page Pairing");

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.retryGenuineCheck,
        page: seededPages.genuineCheckRefused,
        source: seededPages.genuineCheckStarted,
      }),
      expect.anything(),
    );
  });

  it("should use Ledger Sync as the source of a skip drawer click", () => {
    jest.mocked(getCurrentTrackingPage).mockReturnValueOnce(seededPages.checksSuccess);
    jest.mocked(getPreviousTrackingPage).mockReturnValue(seededPages.ledgerSync);

    trackSeededPage(seededPages.ledgerSync);
    trackSeededClick(seededButtons.yesSkip, seededPages.skipDrawer);
    trackSeededClick(seededButtons.enableSync, seededPages.skipDrawer);
    jest.mocked(getPreviousTrackingPage).mockReturnValue("Page Pairing");

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.yesSkip,
        page: seededPages.skipDrawer,
        source: seededPages.ledgerSync,
      }),
      expect.anything(),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.enableSync,
        page: seededPages.skipDrawer,
        source: seededPages.ledgerSync,
      }),
      expect.anything(),
    );
  });

  it("should publish a seeded page without pinning source itself", () => {
    rememberSeededOnboarding({ deviceType: "stax", deviceVersion: "1.2.0" });

    trackSeededPage(seededPages.ledgerSync);

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: seededPages.ledgerSync,
        props: {
          platform: "lwm",
          sourceFlow: "onboarding",
          "onboarding type": "seeded device",
          seedConfiguration: "already_seeded",
          deviceType: "stax",
          deviceVersion: "1.2.0",
        },
      },
      { updateRoutes: true, refreshSource: true, callerWins: seededCallerWins },
    );
  });
});
