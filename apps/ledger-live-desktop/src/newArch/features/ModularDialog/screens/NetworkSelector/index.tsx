import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkSelectorContent } from "./components/NetworkSelectorContent";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";

export type NetworkSelectorProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  selectedAssetId?: string;
};

export function NetworkSelector({
  networks,
  onNetworkSelected,
  networksConfiguration,
  selectedAssetId,
}: Readonly<NetworkSelectorProps>) {
  return (
    <>
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION}
        networksConfig={networksConfiguration}
        formatNetworkConfig
      />
      <NetworkSelectorContent
        networks={networks}
        onNetworkSelected={onNetworkSelected}
        networksConfig={networksConfiguration}
        selectedAssetId={selectedAssetId}
      />
    </>
  );
}
