import React, { useCallback, useMemo } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { partitionByAvailability } from "@ledgerhq/live-common/modularDrawer/utils/partitionByAvailability";
import { NetworkListItem } from "../NetworkListItem";
import type { ReactElement, ReactNode } from "react";
import {
  UNAVAILABLE_SECTION_HEADER_HEIGHT,
  UnavailableSectionHeader,
} from "LLD/features/ModularDialog/components/UnavailableSectionHeader";

type NetworkWithUI = CryptoOrTokenCurrency & {
  description?: string;
  rightElement?: ReactNode;
  apy?: ReactElement;
};

type NetworkListRow =
  | { kind: "network"; network: NetworkWithUI }
  | { kind: "unavailableSectionHeader" };

type NetworkVirtualListProps = {
  networks: NetworkWithUI[];
  onClick: (networkId: string) => void;
  selectableNetworkIdSet?: ReadonlySet<string>;
};

const getNetworkId = (network: NetworkWithUI) =>
  network.type === "CryptoCurrency" ? network.id : network.parentCurrencyId;

export const NetworkVirtualList = ({
  networks,
  onClick,
  selectableNetworkIdSet,
}: NetworkVirtualListProps) => {
  const rows = useMemo<NetworkListRow[]>(() => {
    const { available, unavailable } = partitionByAvailability(
      networks,
      network => !!selectableNetworkIdSet && !selectableNetworkIdSet.has(getNetworkId(network)),
    );
    const availableRows: NetworkListRow[] = available.map(network => ({
      kind: "network",
      network,
    }));

    if (unavailable.length === 0) return availableRows;

    return [
      ...availableRows,
      { kind: "unavailableSectionHeader" },
      ...unavailable.map(network => ({ kind: "network" as const, network })),
    ];
  }, [networks, selectableNetworkIdSet]);

  const renderNetworkItem = useCallback(
    (row: NetworkListRow) => {
      if (row.kind === "unavailableSectionHeader") {
        return <UnavailableSectionHeader testId="network-selector-unavailable-networks-header" />;
      }

      const { network } = row;
      const networkId = getNetworkId(network);

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

  const getItemHeight = useCallback(
    (row: NetworkListRow) =>
      row.kind === "unavailableSectionHeader" ? UNAVAILABLE_SECTION_HEADER_HEIGHT : undefined,
    [],
  );

  return (
    <VirtualList
      itemHeight={64}
      getItemHeight={getItemHeight}
      items={rows}
      renderItem={renderNetworkItem}
      className="pb-20"
    />
  );
};
