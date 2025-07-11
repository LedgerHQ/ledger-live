import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/native-ui/lib/pre-ldls/index";
import { Flex } from "@ledgerhq/native-ui";

export type NetworkSelectionStepProps = {
  availableNetworks: CryptoOrTokenCurrency[];
  onNetworkSelected: (asset: CryptoOrTokenCurrency) => void;
};

const NetworkSelection = ({
  availableNetworks,
  onNetworkSelected,
}: Readonly<NetworkSelectionStepProps>) => {
  const networks = availableNetworks?.map(network => ({
    name: network.name,
    id: network.id,
    ticker: network.ticker,
  }));

  const handleNetworkClick = (networkId: string) => {
    const originalNetwork = availableNetworks.find(n => n.id === networkId);
    if (originalNetwork) {
      onNetworkSelected(originalNetwork);
    }
  };

  return (
    <Flex>
      <NetworkList networks={networks} onClick={handleNetworkClick} />
    </Flex>
  );
};

export default React.memo(NetworkSelection);
