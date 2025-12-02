import React, { useCallback } from "react";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls";
import { Network, NetworkListItem } from "../NetworkListItem";

type NetworkVirtualListProps = {
  networks: Network[];
  onClick: (networkId: string) => void;
};

export const NetworkVirtualList = ({ networks, onClick }: NetworkVirtualListProps) => {
  const renderNetworkItem = useCallback(
    (network: Network) => {
      const networkId = network.type === "CryptoCurrency" ? network.id : network.parentCurrency.id;

      return <NetworkListItem {...network} onClick={() => onClick(networkId)} />;
    },
    [onClick],
  );

  return <VirtualList itemHeight={64} items={networks} renderItem={renderNetworkItem} />;
};
