import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork as NetworksList } from "./components";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/types";

export type NetworkSelectionStepProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  source: string;
  flow: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
};

export function NetworkSelection({
  networks,
  onNetworkSelected,
  source,
  flow,
  networksConfiguration,
}: Readonly<NetworkSelectionStepProps>) {
  return (
    <>
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION}
        source={source}
        flow={flow}
        networksConfig={networksConfiguration}
        formatNetworkConfig
      />
      <NetworksList
        networks={networks}
        onNetworkSelected={onNetworkSelected}
        flow={flow}
        source={source}
        networksConfig={networksConfiguration}
      />
    </>
  );
}
