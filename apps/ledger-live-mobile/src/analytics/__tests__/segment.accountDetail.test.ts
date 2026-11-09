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

const stubAccountDetail = (accountDetail: Features["accountDetail"] | null) =>
  segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null =>
    key === "accountDetail" ? (accountDetail as Features[T] | null) : null,
  );

const expectTrackedTraits = (traits: Record<string, boolean>) =>
  waitFor(() =>
    expect(mockTrack).toHaveBeenCalledWith("TestEvent", expect.objectContaining(traits)),
  );

describe("segment accountDetail traits", () => {
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

  it("sends false traits when the feature-flag method is unset", async () => {
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await expectTrackedTraits({ accountDetail: false, accountDetailAnalyticsBanner: false });
  });

  it("sends the analyticsBanner param next to the accountDetail flag", async () => {
    stubAccountDetail({ enabled: true, params: { analyticsBanner: true } });
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await expectTrackedTraits({ accountDetail: true, accountDetailAnalyticsBanner: true });
  });

  it("sends accountDetailAnalyticsBanner false when the param is off", async () => {
    stubAccountDetail({ enabled: true, params: { analyticsBanner: false } });
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await expectTrackedTraits({ accountDetail: true, accountDetailAnalyticsBanner: false });
  });

  it("sends accountDetailAnalyticsBanner false when the flag is off", async () => {
    stubAccountDetail({ enabled: false, params: { analyticsBanner: true } });
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await expectTrackedTraits({ accountDetail: false, accountDetailAnalyticsBanner: false });
  });
});
