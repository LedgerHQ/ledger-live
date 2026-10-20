jest.unmock("@shared/analytics");
jest.unmock("../segment");
jest.unmock("~/renderer/analytics/segment");
jest.unmock("src/renderer/analytics/segment");

const mockIdentify = jest.fn();
const mockTrack = jest.fn();

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn(() => ({
      identify: mockIdentify,
      track: mockTrack,
    })),
  },
}));

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    analyticsPage: jest.fn(),
    analyticsStart: jest.fn(),
    analyticsTrack: jest.fn(),
    onReduxAction: jest.fn(),
  },
}));

import { track } from "@shared/analytics";
import type { FeatureId } from "@shared/feature-flags";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { setAnalyticsFeatureFlagMethod, startAnalytics } from "../segment";

const createStoreWithAnalytics = () =>
  createStore({
    state: {
      settings: {
        ...SETTINGS_INITIAL_STATE,
        shareAnalytics: true,
        sharePersonalizedRecommandations: false,
      },
    } as State,
    fetchRemoteFlags: null,
  });

const stubRecoverV2 = (enabled: boolean | null) => {
  setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T) =>
    key === "recoverV2" && enabled !== null ? ({ enabled } as never) : null,
  );
};

describe("segment recoverV2 trait", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    setAnalyticsFeatureFlagMethod(null);
  });

  it.each([
    ["enabled", true, true],
    ["disabled", false, false],
    ["unavailable", null, false],
  ] as const)("sends recoverV2 %s on identify and events", async (_label, flag, expected) => {
    stubRecoverV2(flag);
    await startAnalytics(createStoreWithAnalytics());

    expect(mockIdentify.mock.calls.at(-1)![1]).toEqual(
      expect.objectContaining({ recoverV2: expected }),
    );

    await track("TestEvent", {});

    expect(mockTrack.mock.calls.at(-1)![1]).toEqual(
      expect.objectContaining({ recoverV2: expected }),
    );
  });
});
