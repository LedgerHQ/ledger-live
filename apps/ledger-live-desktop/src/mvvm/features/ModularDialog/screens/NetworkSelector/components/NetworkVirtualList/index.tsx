import React, { useCallback } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkListItem } from "../NetworkListItem";
import type { ReactElement, ReactNode } from "react";

type NetworkWithUI = CryptoOrTokenCurrency & {
  description?: string;
  rightElement?: ReactNode;
  apy?: ReactElement;
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

  return (
    <VirtualList
      itemHeight={64}
      items={networks}
      renderItem={renderNetworkItem}
      className="pb-20"
    />
  );
};
