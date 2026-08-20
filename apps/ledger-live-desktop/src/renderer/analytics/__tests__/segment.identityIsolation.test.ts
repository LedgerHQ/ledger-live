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

import createStore from "~/state-manager/configureStore";
import { withFlagOverrides } from "tests/testSetup";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { shouldIncludeSegmentIdentity } from "../segmentIdentity";
import { startAnalytics, updateIdentify } from "../segment";

const createTestState = (overrides: Partial<State> = {}): State =>
  ({
    settings: {
      ...SETTINGS_INITIAL_STATE,
      shareAnalytics: false,
      sharePersonalizedRecommandations: false,
    },
    ...overrides,
  }) as State;

describe("segment identity isolation (LIVE-34723)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when flag is off regardless of consent", () => {
    const store = createStore({
      state: createTestState(
        withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: false } }) as Partial<State>,
      ),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
  });

  it("returns false when flag is on and tracking is disabled", () => {
    const store = createStore({
      state: createTestState(
        withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } }) as Partial<State>,
      ),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(false);
  });

  it("returns true when flag is on and analytics is enabled", () => {
    const store = createStore({
      state: createTestState({
        ...(withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } }) as Partial<State>),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          shareAnalytics: true,
          sharePersonalizedRecommandations: false,
        },
      }),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
  });

  describe("updateIdentify({ force: true })", () => {
    it("omits userId and braze_external_id when flag is on and tracking is off", async () => {
      const store = createStore({
        state: createTestState(
          withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } }) as Partial<State>,
        ),
        fetchRemoteFlags: null,
      });

      await startAnalytics(store);
      mockIdentify.mockClear();

      await updateIdentify({ force: true });

      expect(mockIdentify).toHaveBeenCalled();
      const [segmentUserId, traits] = mockIdentify.mock.calls.at(-1)!;
      expect(segmentUserId).toBeUndefined();
      expect(traits).not.toHaveProperty("userId");
      expect(traits).not.toHaveProperty("braze_external_id");
      expect(traits).toMatchObject({
        optInAnalytics: false,
        optInPersonalRecommendations: false,
      });
    });

    it("includes identity when flag is on and analytics is enabled", async () => {
      const store = createStore({
        state: createTestState({
          ...(withFlagOverrides({
            brazeOptOutIdentityCleanup: { enabled: true },
          }) as Partial<State>),
          settings: {
            ...SETTINGS_INITIAL_STATE,
            shareAnalytics: true,
            sharePersonalizedRecommandations: false,
          },
        }),
        fetchRemoteFlags: null,
      });

      await startAnalytics(store);
      expect(mockIdentify).toHaveBeenCalled();
      const [segmentUserId, traits] = mockIdentify.mock.calls.at(-1)!;
      expect(segmentUserId).toEqual(expect.any(String));
      expect(traits).toEqual(
        expect.objectContaining({
          userId: segmentUserId,
          braze_external_id: segmentUserId,
        }),
      );
    });
  });
});
