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

const { _identifyMock: mockIdentify, _trackMock: mockTrack } =
  require("@segment/analytics-react-native") as {
    _identifyMock: jest.Mock;
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

const stubRecoverV2 = (enabled: boolean | null) => {
  segment.setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T): Features[T] | null => {
    if (key === "recoverV2" && enabled !== null) {
      return { enabled } as Features[T];
    }
    return null;
  });
};

describe("segment recoverV2 trait", () => {
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

  it.each([
    ["enabled", true, true],
    ["disabled", false, false],
    ["unavailable", null, false],
  ] as const)("sends recoverV2 %s on identify and events", async (_label, flag, expected) => {
    stubRecoverV2(flag);
    await segment.start(store);

    expect(mockIdentify).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ recoverV2: expected }),
    );

    mockTrack.mockClear();
    track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ recoverV2: expected }),
      ),
    );
  });
});
