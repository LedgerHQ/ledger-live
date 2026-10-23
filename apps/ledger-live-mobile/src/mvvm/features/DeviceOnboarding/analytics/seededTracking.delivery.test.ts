jest.unmock("@shared/analytics");

import {
  resetTrackingPages,
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setPropsFilter,
  trackPage,
} from "@shared/analytics";
import {
  rememberSeededOnboarding,
  resetSeededOnboardingAnalytics,
  seededButtons,
  seededPages,
  trackSeededChecksSuccess,
  trackSeededClick,
  trackSeededOnboardingStarted,
  trackSeededPage,
} from "./seededTracking";

const track = jest.fn();

describe("seeded analytics delivery", () => {
  beforeEach(() => {
    track.mockClear();
    resetSeededOnboardingAnalytics();
    resetTrackingPages();
    setAnalytics({ track });
    setEnabledFn(() => true);
    setPropsFilter(undefined);
    setExtraPropsFn(() => ({
      platform: "mobile",
      deviceVersion: "9.9.9",
      deviceType: "nanoX",
      appVersion: "1.0.0",
    }));
  });

  afterEach(() => {
    setAnalytics(undefined);
    setEnabledFn(undefined);
    setExtraPropsFn(undefined);
    setPropsFilter(undefined);
  });

  it("keeps the seeded device on the delivered click when host enrichment disagrees", async () => {
    rememberSeededOnboarding({ deviceType: "stax", deviceVersion: "1.4.0" });

    await trackSeededClick("close", seededPages.ledgerSync);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        platform: "lwm",
        sourceFlow: "onboarding",
        "onboarding type": "seeded device",
        seedConfiguration: "already_seeded",
        deviceType: "stax",
        deviceVersion: "1.4.0",
        appVersion: "1.0.0",
        button: "close",
        page: seededPages.ledgerSync,
      }),
    );
  });

  it("does not borrow the last device when this session has no firmware yet", async () => {
    rememberSeededOnboarding({ deviceType: "stax", firmwareChecked: true });

    await trackSeededOnboardingStarted();

    const props = track.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(props).toEqual(
      expect.objectContaining({
        platform: "lwm",
        "onboarding type": "seeded device",
        deviceType: "stax",
        firmware_update_availability: "no",
        appVersion: "1.0.0",
      }),
    );
    expect(props).not.toHaveProperty("deviceVersion");
  });

  it("keeps the seeded page properties on the delivered page event", async () => {
    rememberSeededOnboarding({ deviceType: "stax", deviceVersion: "1.4.0" });

    await trackSeededPage(seededPages.ledgerSync);

    expect(track).toHaveBeenCalledWith(
      `Page ${seededPages.ledgerSync}`,
      expect.objectContaining({
        platform: "lwm",
        "onboarding type": "seeded device",
        deviceType: "stax",
        deviceVersion: "1.4.0",
        appVersion: "1.0.0",
      }),
    );
    expect(track.mock.calls[0]?.[1]).not.toHaveProperty("deviceType", "nanoX");
  });

  it("keeps the predecessor as source after a refusal drawer rewrites the previous page", async () => {
    await trackSeededPage(seededPages.genuineCheckStarted);
    await trackSeededPage(seededPages.genuineCheckRefused);
    await trackPage(
      { category: "Genuine check error", name: "drawer" },
      { updateRoutes: true, refreshSource: false },
    );
    track.mockClear();

    await trackSeededClick(seededButtons.retryGenuineCheck, seededPages.genuineCheckRefused);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.retryGenuineCheck,
        page: seededPages.genuineCheckRefused,
        source: seededPages.genuineCheckStarted,
      }),
    );
  });

  it("uses Ledger Sync as the source of a skip drawer click", async () => {
    await trackSeededPage(seededPages.checksSuccess);
    await trackSeededPage(seededPages.ledgerSync);
    await trackPage(
      { category: seededPages.skipDrawer },
      { updateRoutes: true, refreshSource: true },
    );
    track.mockClear();

    await trackSeededClick(seededButtons.yesSkip, seededPages.skipDrawer);
    await trackSeededClick(seededButtons.enableSync, seededPages.skipDrawer);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.yesSkip,
        page: seededPages.skipDrawer,
        source: seededPages.ledgerSync,
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: seededButtons.enableSync,
        page: seededPages.skipDrawer,
        source: seededPages.ledgerSync,
      }),
    );
  });

  it("emits checks success again after the current page leaves success", async () => {
    await trackSeededChecksSuccess();
    await trackSeededPage(seededPages.checkOsVersion);
    track.mockClear();

    await trackSeededChecksSuccess();

    expect(track).toHaveBeenCalledWith(
      `Page ${seededPages.checksSuccess}`,
      expect.objectContaining({ source: seededPages.checkOsVersion }),
    );
  });
});
