import React, { useCallback } from "react";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkListItem } from "../NetworkListItem";

type NetworkWithUI = CryptoOrTokenCurrency & {
  description?: string;
  rightElement?: React.ReactNode;
  apy?: React.ReactElement;
};

type NetworkVirtualListProps = {
  networks: NetworkWithUI[];
  onClick: (networkId: string) => void;
};

export const NetworkVirtualList = ({ networks, onClick }: NetworkVirtualListProps) => {
  const renderNetworkItem = useCallback(
    (network: NetworkWithUI) => {
      const networkId = network.type === "CryptoCurrency" ? network.id : network.parentCurrency.id;
      return (
        <NetworkListItem
          currency={network}
          description={network.description}
          rightElement={network.rightElement}
          apy={network.apy}
          onClick={() => onClick(networkId)}
        />
      );
    },
    [onClick],
  );

  return <VirtualList itemHeight={64} items={networks} renderItem={renderNetworkItem} />;
};
