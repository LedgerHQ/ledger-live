import React from "react";

type MockedListProps =
  | {
      assets: Array<{ id: string; name: string }>;
      networks?: never;
      onClick: (asset: { id: string; name: string }) => void;
    }
  | {
      networks: Array<{ id: string; name: string }>;
      assets?: never;
      onClick: (network: string) => void;
    };

// Needed since we have a virtualized list
export const MockedList = ({ assets, networks, onClick }: MockedListProps) => {
  const list = networks || assets;

  const handleClick = (item: { id: string; name: string }) =>
    networks ? onClick(item.id) : onClick(item);

  return (
    <div data-testid="asset-list">
      {list.map(item => (
        <div key={item.id} data-testid={`asset-item-${item.id}`} onClick={() => handleClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
