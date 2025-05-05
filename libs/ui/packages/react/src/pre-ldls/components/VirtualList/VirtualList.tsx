import React, { ReactNode } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

export const VirtualList = ({
  count,
  itemHeight,
  renderItem,
}: {
  count: number;
  itemHeight: number;
  renderItem: (index: number) => ReactNode;
}) => {
  return (
    <AutoSizer style={{ height: "100%", width: "100%" }}>
      {({ height }: { height: number }) => (
        <List
          height={height}
          itemCount={count}
          itemSize={itemHeight}
          layout="vertical"
          width="100%"
        >
          {({ index, style }) => <div style={style}>{renderItem(index)}</div>}
        </List>
      )}
    </AutoSizer>
  );
};
