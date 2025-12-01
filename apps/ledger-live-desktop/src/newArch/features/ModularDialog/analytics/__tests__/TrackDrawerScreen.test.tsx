import React from "react";
import { render } from "tests/testSetup";
import TrackDrawerScreen from "../TrackDrawerScreen";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_PAGE_NAME } from "../modularDrawer.types";
import { trackPage } from "~/renderer/analytics/segment";

describe("TrackDrawerScreen", () => {
  it("calls track page with flow and source", () => {
    const page = MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };

    render(<TrackDrawerScreen page={page} />, { initialState: { modularDrawer: params } });

    expect(trackPage).toHaveBeenCalledWith(
      "Asset Selection",
      undefined,
      { flow: "flowtest", source: "sourcetest" },
      true,
      true,
    );
  });

  it("formats asset configuration and track it", () => {
    const page = MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };
    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      filter: "topNetworks",
    };

    render(<TrackDrawerScreen page={page} formatAssetConfig assetsConfig={assetsConfig} />, {
      initialState: { modularDrawer: params },
    });

    expect(trackPage).toHaveBeenCalledWith(
      "Asset Selection",
      undefined,
      {
        asset_component_features: { apy: false, balance: false, filter: true, market_trend: false },
        flow: "flowtest",
        source: "sourcetest",
      },
      true,
      true,
    );
  });

  it("formats network configuration and track it", () => {
    const page = MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
    };

    render(<TrackDrawerScreen page={page} formatNetworkConfig networksConfig={networksConfig} />, {
      initialState: { modularDrawer: params },
    });

    expect(trackPage).toHaveBeenCalledWith(
      "Network Selection",
      undefined,
      {
        flow: "flowtest",
        network_component_features: {
          numberOfAccounts: true,
          numberOfAccountsAndApy: false,
          balance: false,
        },
        source: "sourcetest",
      },
      true,
      true,
    );
  });
});
