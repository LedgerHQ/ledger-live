/**
 * Tests for lazyOnboardingBanner identify traits via extraProperties → track().
 */
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { FeatureId, Features } from "@shared/feature-flags";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const analyticsConsentInfo = {
  consentDate: "2026-04-29T00:00:00.000Z",
  privacyPolicyVersion: 1,
};

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  }) as AppStore;

describe("segment lazyOnboardingBanner traits", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    segment.setAnalyticsFeatureFlagMethod(null);
    jest.useFakeTimers();
  });

  let store: AppStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = makeStore();
    store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    store.dispatch(setAnalytics(true));
  });

  it("includes false banner traits when the feature-flag method is unset", async () => {
    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          lazyOnboardingBanner: false,
          lazyOnboardingBannerMode: null,
        }),
      ),
    );
  });

  it("includes mode only when lazyOnboardingBanner is enabled", async () => {
    segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null => {
      if (key === "lazyOnboardingBanner") {
        return {
          enabled: true,
          params: { mode: "shop_direct", link: "https://shop.ledger.com" },
        } as Features[T];
      }
      return null;
    });

    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          lazyOnboardingBanner: true,
          lazyOnboardingBannerMode: "shop_direct",
        }),
      ),
    );
  });

  it("omits mode when lazyOnboardingBanner is disabled even if params exist", async () => {
    segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null => {
      if (key === "lazyOnboardingBanner") {
        return {
          enabled: false,
          params: { mode: "feature_intro", link: "https://shop.ledger.com" },
        } as Features[T];
      }
      return null;
    });

    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({
          lazyOnboardingBanner: false,
          lazyOnboardingBannerMode: null,
        }),
      ),
    );
  });
});
