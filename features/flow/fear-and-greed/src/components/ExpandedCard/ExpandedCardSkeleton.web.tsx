import React from "react";
import { Skeleton, Tile, TileContent } from "@ledgerhq/lumen-ui-react";

export function ExpandedCardSkeleton() {
  return (
    <Tile appearance="card" className="w-full" data-testid="market-top-card-2" aria-hidden>
      <Skeleton className="h-12 w-1/3 self-start rounded-full" />
      <TileContent className="items-start text-left">
        <Skeleton className="h-32 w-full rounded-md" />
      </TileContent>
    </Tile>
  );
}
