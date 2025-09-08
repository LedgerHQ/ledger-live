import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork as NetworksList } from "./components";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

export type NetworkSelectionStepProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  currenciesByProvider: CurrenciesByProviderId[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  selectedAssetId?: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export function NetworkSelection({
  networks,
  onNetworkSelected,
  networksConfiguration,
  currenciesByProvider,
  selectedAssetId,
  accounts$,
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
        currenciesByProvider={currenciesByProvider}
        selectedAssetId={selectedAssetId}
        accounts$={accounts$}
      />
    </>
  );
}
