import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Link, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ComponentProps } from "react";
import type { ActionTileId, ActionTilesViewProps } from "./types";

type TileIcon = ComponentProps<typeof TileButton>["icon"];

const ICONS: Partial<Record<ActionTileId, TileIcon>> = {
  deposit: Plus,
  request: Link,
};

export function ActionTilesView({ tiles }: ActionTilesViewProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }} testID="action-tiles">
      {tiles.map(tile => (
        <TileButton
          key={tile.id}
          lx={{ flex: 1 }}
          icon={ICONS[tile.id] ?? Plus}
          onPress={tile.onPress}
          testID={`action-tile-${tile.id}`}
          accessibilityLabel={tile.label}
          isFull
        >
          {tile.label}
        </TileButton>
      ))}
    </Box>
  );
}
