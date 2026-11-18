import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Link, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ComponentProps } from "react";
import { useTranslation } from "@shared/i18n";
import type { ActionTileId, ActionTileInput, ActionTilesViewProps } from "./types";

type TileIcon = ComponentProps<typeof TileButton>["icon"];

type NativeTileId = Exclude<ActionTileId, "pay">;

type NativeTile = ActionTileInput & Readonly<{ id: NativeTileId }>;

const ICONS: Record<NativeTileId, TileIcon> = {
  deposit: Plus,
  request: Link,
};

function isNativeTile(tile: ActionTileInput): tile is NativeTile {
  return tile.id in ICONS;
}

export function ActionTilesView({ tiles }: ActionTilesViewProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }} testID="action-tiles">
      {tiles.filter(isNativeTile).map(tile => {
        const label = t(`payTab.actions.${tile.id}`);

        return (
          <TileButton
            key={tile.id}
            lx={{ flex: 1 }}
            icon={ICONS[tile.id]}
            onPress={tile.onOpenFlow}
            testID={`action-tile-${tile.id}`}
            accessibilityLabel={label}
            isFull
          >
            {label}
          </TileButton>
        );
      })}
    </Box>
  );
}
