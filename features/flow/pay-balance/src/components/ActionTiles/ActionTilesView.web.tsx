import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Link, Telegram, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ComponentProps } from "react";
import type { ActionTileId, ActionTilesViewProps } from "./types";

type TileIcon = ComponentProps<typeof Button>["icon"];

const ICONS: Record<ActionTileId, TileIcon> = {
  deposit: Plus,
  request: Link,
  pay: Telegram,
};

export function ActionTilesView({ tiles }: ActionTilesViewProps) {
  return (
    <div className="flex flex-wrap gap-8" data-testid="action-tiles">
      {tiles.map(tile => (
        <Button
          appearance={tile.appearance}
          key={tile.id}
          icon={ICONS[tile.id]}
          onClick={tile.onPress}
          data-testid={`action-tile-${tile.id}`}
          size="sm"
          className="shrink-0"
        >
          {tile.label}
        </Button>
      ))}
    </div>
  );
}
