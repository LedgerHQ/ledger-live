import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerAnalytics } from "../useModularDrawerAnalytics";
import { track } from "~/analytics/segment";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { EVENTS_NAME } from "../modularDrawer.types";

describe("useModularDrawerAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks event with default params", () => {
    const { result } = renderHook(() => useModularDrawerAnalytics());

    const eventName = EVENTS_NAME.ASSET_CLICKED;
    const params = { flow: "flowtest", source: "sourcetest", asset: "assettest", page: "pagetest" };

    act(() => {
      result.current.trackModularDrawerEvent(eventName, params);
    });

    expect(track).toHaveBeenCalledWith(eventName, params);
  });

  it("formats and tracks asset configuration when formatAssetConfig is true", () => {
    const { result } = renderHook(() => useModularDrawerAnalytics());

    const eventName = EVENTS_NAME.ASSET_CLICKED;
    const params = {
      flow: "flowtest",
      source: "sourcetest",
      asset: "assettest",
      page: "pagetest",
    };

    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      filter: "topNetworks",
    };

    act(() => {
      result.current.trackModularDrawerEvent(eventName, params, {
        formatAssetConfig: true,
        assetsConfig,
      });
    });

    expect(track).toHaveBeenCalledWith(eventName, {
      ...params,
      asset_component_features: {
        apy: false,
        balance: false,
        filter: true,
        market_trend: false,
      },
    });
  });

  it("formats and tracks network configuration when formatNetworkConfig is true", () => {
    const { result } = renderHook(() => useModularDrawerAnalytics());

    const eventName = EVENTS_NAME.NETWORK_CLICKED;
    const params = {
      flow: "flowtest",
      source: "sourcetest",
      network: "networktest",
      page: "pagetest",
    };
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
    };

    act(() => {
      result.current.trackModularDrawerEvent(eventName, params, {
        formatNetworkConfig: true,
        networksConfig,
      });
    });

    expect(track).toHaveBeenCalledWith(eventName, {
      ...params,
      network_component_features: expect.anything(),
    });
  });
});
