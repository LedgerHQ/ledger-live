import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { MARKET_BANNER_ITEMS_COUNT } from "../utils/constants";

const SkeletonList = () => (
  <div className="flex flex-row gap-8 overflow-hidden" data-testid="skeleton-list">
    {Array.from({ length: MARKET_BANNER_ITEMS_COUNT }, (_, index) => (
      <Skeleton key={index} component="tile" />
    ))}
  </div>
);

export default SkeletonList;
