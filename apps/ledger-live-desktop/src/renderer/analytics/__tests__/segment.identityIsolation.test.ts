import createStore from "~/state-manager/configureStore";
import { withFlagOverrides } from "tests/testSetup";
import type { State } from "~/renderer/reducers";
import { shouldIncludeSegmentIdentity } from "../segmentIdentity";

const createTestState = (overrides: Partial<State> = {}): State =>
  ({
    settings: {
      shareAnalytics: false,
      sharePersonalizedRecommandations: false,
    },
    ...overrides,
  }) as State;

describe("segment identity isolation (LIVE-34723)", () => {
  it("returns true when flag is off regardless of consent", () => {
    const store = createStore({
      state: createTestState(withFlagOverrides({})),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
  });

  it("returns false when flag is on and tracking is disabled", () => {
    const store = createStore({
      state: createTestState(withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } })),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(false);
  });

  it("returns true when flag is on and analytics is enabled", () => {
    const store = createStore({
      state: createTestState({
        ...withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } }),
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: false,
        },
      }),
      fetchRemoteFlags: null,
    });
    expect(shouldIncludeSegmentIdentity(store.getState())).toBe(true);
  });
});
