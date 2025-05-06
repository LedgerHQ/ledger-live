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
      items={networks}
      itemHeight={64}
      renderItem={({ name, id }: { name: string; id: string }) => (
        <NetworkItem name={name} onClick={() => onClick(id)} />
      )}
    />
  );
};
