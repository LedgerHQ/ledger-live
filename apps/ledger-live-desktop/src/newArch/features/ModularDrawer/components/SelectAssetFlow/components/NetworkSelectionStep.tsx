import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectNetwork } from "./SelectNetwork";

export type NetworkSelectionStepProps = {
  networks: CryptoOrTokenCurrency[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
};

export function NetworkSelectionStep({
  networks,
  onNetworkSelected,
}: Readonly<NetworkSelectionStepProps>) {
  return (
    <SelectNetwork
      networks={networks}
      onNetworkSelected={onNetworkSelected}
      flow="Modular Asset Flow"
      source="Accounts"
    />
  );
}
