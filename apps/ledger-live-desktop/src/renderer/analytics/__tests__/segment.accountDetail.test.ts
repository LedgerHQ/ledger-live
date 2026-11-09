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

type FlagValue = { enabled: boolean; params?: unknown } | null;

const stubAccountDetail = (accountDetail: FlagValue) =>
  setAnalyticsFeatureFlagMethod(<T extends FeatureId>(key: T) =>
    key === "accountDetail" ? (accountDetail as never) : null,
  );

const lastIdentifyTraits = () => mockIdentify.mock.calls.at(-1)![1];

describe("segment accountDetail traits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    setAnalyticsFeatureFlagMethod(null);
  });

  it("should send the analyticsBanner param next to the accountDetail flag", async () => {
    stubAccountDetail({ enabled: true, params: { analyticsBanner: true } });

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(
      expect.objectContaining({ accountDetail: true, accountDetailAnalyticsBanner: true }),
    );
  });

  it("should send accountDetailAnalyticsBanner false when the param is off", async () => {
    stubAccountDetail({ enabled: true, params: { analyticsBanner: false } });

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(
      expect.objectContaining({ accountDetail: true, accountDetailAnalyticsBanner: false }),
    );
  });

  it("should send accountDetailAnalyticsBanner false when the flag is off", async () => {
    stubAccountDetail({ enabled: false, params: { analyticsBanner: true } });

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(
      expect.objectContaining({ accountDetail: false, accountDetailAnalyticsBanner: false }),
    );
  });

  it("should send both traits as false when the flag is unresolved", async () => {
    stubAccountDetail(null);

    await startAnalytics(createStoreWithAnalytics());

    expect(lastIdentifyTraits()).toEqual(
      expect.objectContaining({ accountDetail: false, accountDetailAnalyticsBanner: false }),
    );
  });
});
