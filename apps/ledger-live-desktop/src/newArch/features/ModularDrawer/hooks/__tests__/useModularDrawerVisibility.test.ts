import { renderHook } from "tests/testSetup";
import { useModularDrawerVisibility } from "../useModularDrawerVisibility";
import { ModularDrawerLocation } from "../../enums";

describe("useModularDrawerVisibility", () => {
  it("should return false if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
  });

  it("should return the correct visibility only if the feature flag is enabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
                [ModularDrawerLocation.SEND_FLOW]: false,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(true);
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.SEND_FLOW)).toBe(false);
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.RECEIVE_FLOW)).toBe(false);
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
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)).toBe(false);
    expect(result.current.isModularDrawerVisible(ModularDrawerLocation.EARN_FLOW)).toBe(false);
  });

  it("should return false for all ModularDrawerLocations if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
                [ModularDrawerLocation.EARN_FLOW]: true,
                [ModularDrawerLocation.LIVE_APP]: true,
                [ModularDrawerLocation.RECEIVE_FLOW]: true,
                [ModularDrawerLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularDrawerLocation).forEach(ModularDrawerLocation => {
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation)).toBe(false);
    });
  });

  it("should return false if all ModularDrawerLocations are enabled & main feature isn't", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
                [ModularDrawerLocation.EARN_FLOW]: true,
                [ModularDrawerLocation.LIVE_APP]: true,
                [ModularDrawerLocation.RECEIVE_FLOW]: true,
                [ModularDrawerLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularDrawerLocation).forEach(ModularDrawerLocation => {
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation)).toBe(false);
    });
  });

  it("should return true if all ModularDrawerLocations are enabled & main feature also", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
                [ModularDrawerLocation.EARN_FLOW]: true,
                [ModularDrawerLocation.LIVE_APP]: true,
                [ModularDrawerLocation.RECEIVE_FLOW]: true,
                [ModularDrawerLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularDrawerLocation).forEach(ModularDrawerLocation => {
      expect(result.current.isModularDrawerVisible(ModularDrawerLocation)).toBe(true);
    });
  });
});
