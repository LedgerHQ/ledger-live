import { renderHook } from "tests/testSetup";
import { useModularDrawerVisibility, Location } from "../useModularDrawerVisibility";

describe("useModularDrawerVisibility", () => {
  it("should return false if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [Location.ADD_ACCOUNT]: true,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(Location.ADD_ACCOUNT)).toBe(false);
  });

  it("should return the correct visibility only if the feature flag is enabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [Location.ADD_ACCOUNT]: true,
                [Location.SEND_FLOW]: false,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(Location.ADD_ACCOUNT)).toBe(true);
    expect(result.current.isModularDrawerVisible(Location.SEND_FLOW)).toBe(false);
    expect(result.current.isModularDrawerVisible(Location.RECEIVE_FLOW)).toBe(false);
  });

  it("should handle missing params gracefully", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: null,
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(Location.ADD_ACCOUNT)).toBe(false);
    expect(result.current.isModularDrawerVisible(Location.EARN_FLOW)).toBe(false);
  });

  it("should return false for all locations if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [Location.ADD_ACCOUNT]: true,
                [Location.EARN_FLOW]: true,
                [Location.LIVE_APP]: true,
                [Location.RECEIVE_FLOW]: true,
                [Location.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(Location).forEach(location => {
      expect(result.current.isModularDrawerVisible(location)).toBe(false);
    });
  });

  it("should return false if all locations are enabled & main feature isn't", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [Location.ADD_ACCOUNT]: true,
                [Location.EARN_FLOW]: true,
                [Location.LIVE_APP]: true,
                [Location.RECEIVE_FLOW]: true,
                [Location.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(Location).forEach(location => {
      expect(result.current.isModularDrawerVisible(location)).toBe(false);
    });
  });

  it("should return true if all locations are enabled & main feature also", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [Location.ADD_ACCOUNT]: true,
                [Location.EARN_FLOW]: true,
                [Location.LIVE_APP]: true,
                [Location.RECEIVE_FLOW]: true,
                [Location.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(Location).forEach(location => {
      expect(result.current.isModularDrawerVisible(location)).toBe(true);
    });
  });
});
