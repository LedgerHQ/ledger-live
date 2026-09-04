jest.unmock("../segment");
jest.unmock("~/renderer/analytics/segment");
jest.unmock("src/renderer/analytics/segment");

const mockIdentify = jest.fn();

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn(() => ({
      identify: mockIdentify,
      track: jest.fn(),
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

import type { FeatureId } from "@shared/feature-flags";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { setAnalyticsFeatureFlagMethod, startAnalytics } from "../segment";

const createTestState = (): State =>
  ({
    settings: {
      ...SETTINGS_INITIAL_STATE,
      shareAnalytics: true,
      sharePersonalizedRecommandations: false,
    },
  }) as State;

const createStoreWithAnalytics = () =>
  createStore({ state: createTestState(), fetchRemoteFlags: null });

const stubFeatureFlagMethod = (stableSavings: { enabled: boolean; params?: unknown } | null) =>
  setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T) =>
    key === "stableSavings" ? (stableSavings as never) : null,
  );

const lastIdentifyTraits = () => mockIdentify.mock.calls.at(-1)![1];

describe("segment stableSavings trait", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    setAnalyticsFeatureFlagMethod(null);
  });

  it("should send stableSavings true when the flag is enabled", async () => {
    stubFeatureFlagMethod({ enabled: true, params: { cohort: "a" } });

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(expect.objectContaining({ stableSavings: true }));
  });

  it("should send stableSavings false when the flag is disabled", async () => {
    stubFeatureFlagMethod({ enabled: false });

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(expect.objectContaining({ stableSavings: false }));
  });

  it("should send stableSavings false when the flag is unresolved", async () => {
    stubFeatureFlagMethod(null);

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(expect.objectContaining({ stableSavings: false }));
  });
});
