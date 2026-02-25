import React, { memo } from "react";
import { listItemHeight, TablePlaceholder } from "~/renderer/screens/market/components/Table";

export const ListSkeleton = memo(function ListSkeleton() {
  const itemCount = 20;

  return (
    <div
      style={{ height: `${itemCount * listItemHeight}px`, width: "100%", position: "relative" }}
      data-testid="market-list-skeleton"
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${listItemHeight}px`,
            transform: `translateY(${index * listItemHeight}px)`,
          }}
          className="px-20"
        >
          <TablePlaceholder size={7} />
        </div>
      ))}
    </div>
  );
});
