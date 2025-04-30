import React from "react";
import { NetworkItem } from "../NetworkItem/NetworkItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const NetworkList = ({
  networks,
  onClick,
}: {
  networks: { name: string; id: string }[];
  onClick: (networkId: string) => void;
}) => {
  return (
    <VirtualList
      itemHeight={64}
      count={networks.length}
      renderItem={(i: number) => (
        <NetworkItem name={networks[i].name} onClick={() => onClick(networks[i].id)} />
      )}
    />
  );
};
