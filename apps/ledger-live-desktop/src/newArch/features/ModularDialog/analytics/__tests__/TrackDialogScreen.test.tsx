import React from "react";
import { render } from "tests/testSetup";
import TrackDialogScreen from "../TrackDialogScreen";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DIALOG_PAGE_NAME } from "../modularDialog.types";
import { trackPage } from "~/renderer/analytics/segment";

describe("TrackDialogScreen", () => {
  it("calls track page with flow and source", () => {
    const page = MODULAR_DIALOG_PAGE_NAME.MODULAR_ASSET_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };

    render(<TrackDialogScreen page={page} />, { initialState: { modularDrawer: params } });

    expect(trackPage).toHaveBeenCalledWith(
      "Asset Selection",
      undefined,
      { flow: "flowtest", source: "sourcetest" },
      true,
      true,
    );
  });

  it("formats asset configuration and track it", () => {
    const page = MODULAR_DIALOG_PAGE_NAME.MODULAR_ASSET_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };
    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      filter: "topNetworks",
    };

    render(<TrackDialogScreen page={page} formatAssetConfig assetsConfig={assetsConfig} />, {
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
    const page = MODULAR_DIALOG_PAGE_NAME.MODULAR_NETWORK_SELECTION;
    const params = { flow: "flowtest", source: "sourcetest" };
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
    };

    render(<TrackDialogScreen page={page} formatNetworkConfig networksConfig={networksConfig} />, {
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
