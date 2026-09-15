import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

const SkeletonList = () => (
  <div className="flex flex-1 flex-col overflow-hidden px-4" data-testid="modular-dialog-skeleton">
    {Array.from({ length: 10 }, (_, index) => (
      <Skeleton key={index} component="list-item" />
    ))}
  </div>
);

export default SkeletonList;
