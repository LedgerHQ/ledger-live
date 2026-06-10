import React from "react";
import { Skeleton, Tile, TileContent } from "@ledgerhq/lumen-ui-react";

type MarketTopCardPlaceholderProps = {
  readonly testId: string;
};

export function MarketTopCardPlaceholder({ testId }: MarketTopCardPlaceholderProps) {
  return (
    <Tile appearance="card" className="w-full" data-testid={testId} aria-hidden>
      <Skeleton className="h-12 w-1/3 self-start rounded-full" />
      <TileContent className="items-start text-left">
        <Skeleton className="h-32 w-full rounded-12" />
      </TileContent>
    </Tile>
  );
}
