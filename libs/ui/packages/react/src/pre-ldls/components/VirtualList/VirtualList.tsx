import React, { ReactNode } from "react";
import { FixedSizeList as List } from "react-window";

export const VirtualList = ({
  count,
  itemHeight,
  maxHeight,
  renderRow,
}: {
  count: number;
  itemHeight: number;
  maxHeight: number;
  renderRow: (index: number) => ReactNode;
}) => {
  const minHeight = Math.min(count * itemHeight, maxHeight);

  return (
    <List
      height={minHeight}
      itemCount={count}
      itemSize={itemHeight}
      layout="vertical"
      width={"100%"}
    >
      {({ index, style }) => <div style={style}>{renderRow(index)}</div>}
    </List>
  );
};
