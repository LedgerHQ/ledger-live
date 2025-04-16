import React from "react";
import { FixedSizeList as List } from "react-window";

export const VirtualList = ({
  children,
  itemHeight,
  maxHeight,
}: {
  children: React.ReactNode[];
  itemHeight: number;
  maxHeight: number;
}) => {
  const childrenLength = Array.isArray(children) ? children.length : 0;
  const minHeight = Math.min(childrenLength * itemHeight, maxHeight);

  return (
    <List
      height={minHeight}
      itemCount={childrenLength}
      itemSize={itemHeight}
      layout="vertical"
      width={"100%"}
    >
      {({ index, style }) => <div style={style}>{children[index]}</div>}
    </List>
  );
};
