import { renderHook } from "tests/testSetup";
import { useModularDrawerAnalytics } from "../useModularDrawerAnalytics";
import { track } from "~/renderer/analytics/segment";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { EVENTS_NAME } from "../modularDrawer.types";

describe("useModularDrawerAnalytics", () => {
  it("tracks event with default params", () => {
    const madState = { flow: "testFlow", source: "testSource" };

    const { result } = renderHook(() => useModularDrawerAnalytics(), {
      initialState: { modularDrawer: madState },
    });

    const eventName = EVENTS_NAME.ASSET_CLICKED;
    const params = { asset: "assettest", page: "pagetest" };

    result.current.trackModularDrawerEvent(eventName, params);

    expect(track).toHaveBeenCalledWith(eventName, { ...params, ...madState });
  });

  it("formats and tracks asset configuration when formatAssetConfig is true", () => {
    const { result } = renderHook(() => useModularDrawerAnalytics());

    const eventName = EVENTS_NAME.ASSET_CLICKED;
    const params = { asset: "assettest", page: "pagetest" };

    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      filter: "topNetworks",
    };

    result.current.trackModularDrawerEvent(eventName, params, {
      formatAssetConfig: true,
      assetsConfig,
    });

    expect(track).toHaveBeenCalledWith(eventName, {
      ...params,
      asset_component_features: {
        apy: false,
        balance: false,
        filter: true,
        market_trend: false,
      },
      flow: "",
      source: "",
    });
  });

  it("formats and tracks network configuration when formatNetworkConfig is true", () => {
    const { result } = renderHook(() => useModularDrawerAnalytics());

    const eventName = EVENTS_NAME.NETWORK_CLICKED;
    const params = { network: "networktest", page: "pagetest" };
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
    };

    result.current.trackModularDrawerEvent(eventName, params, {
      formatNetworkConfig: true,
      networksConfig,
    });

    expect(track).toHaveBeenCalledWith(eventName, {
      ...params,
      network_component_features: expect.anything(),
      flow: "",
      source: "",
    });
  });
});
