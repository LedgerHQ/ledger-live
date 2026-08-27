/**
 * Tests the stableSavings identify trait, emitted from getFeatureFlagProperties once both the
 * feature-flag method and the segment client are available.
 */
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { FeatureId, Features } from "@shared/feature-flags";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");

const { _identifyMock: mockIdentify } = require("@segment/analytics-react-native") as {
  _identifyMock: jest.Mock;
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

describe("segment stableSavings trait", () => {
  let store: AppStore;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    store = makeStore();
    store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    store.dispatch(setAnalytics(true));
  });

  afterEach(() => {
    segment.setAnalyticsFeatureFlagMethod(null);
    jest.useFakeTimers();
  });

  it("should send stableSavings true when the flag is enabled", async () => {
    segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null =>
      key === "stableSavings" ? ({ enabled: true, params: { cohort: "a" } } as Features[T]) : null,
    );

    await segment.start(store);

    await waitFor(() =>
      expect(mockIdentify).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stableSavings: true }),
      ),
    );
  });
});
