/**
 * Tests for deviceOnboarding traits via extraProperties → track().
 */
import { track } from "@shared/analytics";
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { FeatureId, Features } from "@shared/feature-flags";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

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

const params = {
  connectSeededDevice: true,
  connectUnseededDevice: false,
  offerLedgerSync: false,
  unifiedEntryPoints: false,
};

const stubDeviceOnboardingFlag = (deviceOnboarding: Features["deviceOnboarding"]) =>
  segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null =>
    key === "deviceOnboarding" ? (deviceOnboarding as Features[T]) : null,
  );

describe("segment deviceOnboarding traits", () => {
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

  it("should send the new value when the flag changes after start", async () => {
    stubDeviceOnboardingFlag({ enabled: false, params });
    await segment.start(store);

    stubDeviceOnboardingFlag({ enabled: true, params });
    mockTrack.mockClear();

    track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ deviceOnboarding: true, connectSeededDevice: true }),
      ),
    );
  });
});
