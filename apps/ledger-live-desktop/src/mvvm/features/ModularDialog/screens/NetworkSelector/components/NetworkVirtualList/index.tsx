import React, { useCallback } from "react";
import { VirtualList } from "LLD/components/VirtualList";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useAvailabilityRows } from "@ledgerhq/live-common/modularDrawer/hooks/useAvailabilityRows";
import type { AvailabilityRow } from "@ledgerhq/live-common/modularDrawer/utils/buildAvailabilityRows";
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
  const isUnavailableNetwork = useCallback(
    (network: NetworkWithUI) =>
      !!selectableNetworkIdSet && !selectableNetworkIdSet.has(getNetworkId(network)),
    [selectableNetworkIdSet],
  );

  const rows = useAvailabilityRows(networks, isUnavailableNetwork);

  const renderNetworkItem = useCallback(
    (row: AvailabilityRow<NetworkWithUI>) => {
      if (row.kind === "unavailableSectionHeader") {
        return <UnavailableSectionHeader testId="network-selector-unavailable-networks-header" />;
      }

      const network = row.item;
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
    (row: AvailabilityRow<NetworkWithUI>) =>
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
