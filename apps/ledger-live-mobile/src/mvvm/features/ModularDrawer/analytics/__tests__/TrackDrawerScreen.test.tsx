import React from "react";
import { render } from "@tests/test-renderer";
import TrackDrawerScreen from "../TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { trackPage } from "@shared/analytics";

describe("TrackDrawerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders TrackScreen with basic props", () => {
    render(
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION}
        source="sourcetest"
        flow="flowtest"
      />,
    );

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
        name: undefined,
        props: expect.objectContaining({
          source: "sourcetest",
          flow: "flowtest",
        }),
      },
      { updateRoutes: true, refreshSource: true, avoidDuplicates: false, mandatory: false },
    );
  });

  it("includes asset_component_features when formatAssetConfig is true", () => {
    const assetsConfig = {
      rightElement: "balance" as const,
      filter: "topNetworks" as const,
    };

    render(
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION}
        source="sourcetest"
        flow="flowtest"
        formatAssetConfig={true}
        assetsConfig={assetsConfig}
      />,
    );

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
        name: undefined,
        props: expect.objectContaining({
          source: "sourcetest",
          flow: "flowtest",
          asset_component_features: expect.anything(),
        }),
      },
      { updateRoutes: true, refreshSource: true, avoidDuplicates: false, mandatory: false },
    );
  });

  it("formats network configuration and track it", () => {
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
    };

    render(
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION}
        source="sourcetest"
        flow="flowtest"
        formatNetworkConfig
        networksConfig={networksConfig}
      />,
    );

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
        name: undefined,
        props: expect.objectContaining({
          flow: "flowtest",
          source: "sourcetest",
          network_component_features: {
            numberOfAccounts: true,
            numberOfAccountsAndApy: false,
            balance: false,
          },
        }),
      },
      { updateRoutes: true, refreshSource: true, avoidDuplicates: false, mandatory: false },
    );
  });
});
