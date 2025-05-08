import React, { useCallback } from "react";
import { NetworkItem } from "../NetworkItem/NetworkItem";
import { VirtualList } from "../VirtualList/VirtualList";

type Network = { name: string; id: string };

export const NetworkList = ({
  networks,
  onClick,
}: {
  networks: Network[];
  onClick: (networkId: string) => void;
}) => {
  const renderNetworkItem = useCallback(
    ({ name, id }: Network) => <NetworkItem name={name} onClick={() => onClick(id)} />,
    [onClick],
  );

  return <VirtualList items={networks} itemHeight={64} renderItem={renderNetworkItem} />;
};
