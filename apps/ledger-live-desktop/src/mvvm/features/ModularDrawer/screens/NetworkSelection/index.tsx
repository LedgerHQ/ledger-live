import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork as NetworksList } from "./components";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";

export type NetworkSelectionStepProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  selectedAssetId?: string;
};

export function NetworkSelection({
  networks,
  onNetworkSelected,
  networksConfiguration,
  selectedAssetId,
}: Readonly<NetworkSelectionStepProps>) {
  return (
    <>
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION}
        networksConfig={networksConfiguration}
        formatNetworkConfig
      />
      <NetworksList
        networks={networks}
        onNetworkSelected={onNetworkSelected}
        networksConfig={networksConfiguration}
        selectedAssetId={selectedAssetId}
      />
    </>
  );
}
