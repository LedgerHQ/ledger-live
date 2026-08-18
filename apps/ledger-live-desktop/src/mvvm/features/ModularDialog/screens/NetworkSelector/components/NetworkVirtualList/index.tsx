import React, { useCallback } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
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
  selectableNetworkIdSet?: ReadonlySet<string>;
};

export const NetworkVirtualList = ({
  networks,
  onClick,
  selectableNetworkIdSet,
}: NetworkVirtualListProps) => {
  const renderNetworkItem = useCallback(
    (network: NetworkWithUI) => {
      const networkId = network.type === "CryptoCurrency" ? network.id : network.parentCurrencyId;
      return (
        <NetworkListItem
          currency={network}
          description={network.description}
          rightElement={network.rightElement}
          apy={network.apy}
          disabled={selectableNetworkIdSet ? !selectableNetworkIdSet.has(networkId) : undefined}
          onClick={() => onClick(networkId)}
        />
      );
    },
    [onClick, selectableNetworkIdSet],
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
