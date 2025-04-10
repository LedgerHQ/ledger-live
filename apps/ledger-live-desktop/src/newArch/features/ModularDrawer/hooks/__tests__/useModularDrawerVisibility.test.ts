import { renderHook } from "tests/testSetup";
import { useModularDrawerVisibility } from "../useModularDrawerVisibility";
import { ModularLocation } from "../../enums";

describe("useModularDrawerVisibility", () => {
  it("should return false if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularLocation.ADD_ACCOUNT]: true,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(ModularLocation.ADD_ACCOUNT)).toBe(false);
  });

  it("should return the correct visibility only if the feature flag is enabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [ModularLocation.ADD_ACCOUNT]: true,
                [ModularLocation.SEND_FLOW]: false,
              },
            },
          },
        },
      },
    });
    expect(result.current.isModularDrawerVisible(ModularLocation.ADD_ACCOUNT)).toBe(true);
    expect(result.current.isModularDrawerVisible(ModularLocation.SEND_FLOW)).toBe(false);
    expect(result.current.isModularDrawerVisible(ModularLocation.RECEIVE_FLOW)).toBe(false);
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
    expect(result.current.isModularDrawerVisible(ModularLocation.ADD_ACCOUNT)).toBe(false);
    expect(result.current.isModularDrawerVisible(ModularLocation.EARN_FLOW)).toBe(false);
  });

  it("should return false for all ModularLocations if the feature flag is disabled", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularLocation.ADD_ACCOUNT]: true,
                [ModularLocation.EARN_FLOW]: true,
                [ModularLocation.LIVE_APP]: true,
                [ModularLocation.RECEIVE_FLOW]: true,
                [ModularLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularLocation).forEach(ModularLocation => {
      expect(result.current.isModularDrawerVisible(ModularLocation)).toBe(false);
    });
  });

  it("should return false if all ModularLocations are enabled & main feature isn't", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: false,
              params: {
                [ModularLocation.ADD_ACCOUNT]: true,
                [ModularLocation.EARN_FLOW]: true,
                [ModularLocation.LIVE_APP]: true,
                [ModularLocation.RECEIVE_FLOW]: true,
                [ModularLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularLocation).forEach(ModularLocation => {
      expect(result.current.isModularDrawerVisible(ModularLocation)).toBe(false);
    });
  });

  it("should return true if all ModularLocations are enabled & main feature also", () => {
    const { result } = renderHook(() => useModularDrawerVisibility(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                [ModularLocation.ADD_ACCOUNT]: true,
                [ModularLocation.EARN_FLOW]: true,
                [ModularLocation.LIVE_APP]: true,
                [ModularLocation.RECEIVE_FLOW]: true,
                [ModularLocation.SEND_FLOW]: true,
              },
            },
          },
        },
      },
    });
    Object.values(ModularLocation).forEach(ModularLocation => {
      expect(result.current.isModularDrawerVisible(ModularLocation)).toBe(true);
    });
  });
});
