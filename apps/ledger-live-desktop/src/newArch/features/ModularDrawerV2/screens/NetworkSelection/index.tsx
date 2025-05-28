import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork as NetworksList } from "./components/List";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export type NetworkSelectionStepProps = {
  networks?: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
};

export function NetworkSelection({
  networks,
  onNetworkSelected,
}: Readonly<NetworkSelectionStepProps>) {
  return (
    <NetworksList
      networks={networks}
      onNetworkSelected={onNetworkSelected}
      flow="Modular Asset Flow"
      source="Accounts"
    />
  );
}
