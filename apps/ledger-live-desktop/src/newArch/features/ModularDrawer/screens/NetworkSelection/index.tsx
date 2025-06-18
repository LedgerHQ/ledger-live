import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork as NetworksList } from "./components";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/types";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

export type NetworkSelectionStepProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  source: string;
  flow: string;
  currenciesByProvider: CurrenciesByProviderId[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  selectedAssetId?: string;
};

export function NetworkSelection({
  networks,
  onNetworkSelected,
  source,
  flow,
  networksConfiguration,
  currenciesByProvider,
  selectedAssetId,
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
        currenciesByProvider={currenciesByProvider}
        selectedAssetId={selectedAssetId}
      />
    </>
  );
}
