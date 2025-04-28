import React, { useCallback } from "react";
import { Network, NetworkItem } from "../NetworkItem/NetworkItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const NetworkList = ({
  networks,
  onClick,
}: {
  networks: Network[];
  onClick: (networkId: string) => void;
}) => {
  const renderNetworkItem = useCallback(
    ({ name, id, ticker }: Network) => (
      <NetworkItem name={name} id={id} ticker={ticker} onClick={() => onClick(id)} />
    ),
    [onClick],
  );

  return <VirtualList items={networks} itemHeight={64} renderItem={renderNetworkItem} />;
};
