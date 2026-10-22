import React, { type ComponentType } from "react";
import { Box, TileButton, type IconProps } from "@ledgerhq/lumen-ui-rnative";
import {
  ArrowDown,
  Exchange,
  Minus,
  MoreHorizontal,
  Plus,
  TransferVertical,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { QuickActionTile, QuickActionTileId } from "@features/platform-quick-actions";
import { useTranslation } from "@shared/i18n";

const TILE_ICONS: Record<QuickActionTileId, ComponentType<IconProps>> = {
  transfer: TransferVertical,
  receive: ArrowDown,
  swap: Exchange,
  buy: Plus,
  sell: Minus,
  more: MoreHorizontal,
};

type Props = Readonly<{
  tiles: readonly QuickActionTile[];
  onTilePress: (id: QuickActionTileId) => void;
  testID?: string;
}>;

export function AccountActions({ tiles, onTilePress, testID }: Props) {
  const { t } = useTranslation();
  if (tiles.length === 0) return null;

  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }} testID={testID}>
      {tiles.map(({ id, state }) => {
        const label = t(`accountDetailHero.actions.${id}`);
        return (
          <TileButton
            key={id}
            lx={{ flex: 1 }}
            icon={TILE_ICONS[id]}
            onPress={() => onTilePress(id)}
            disabled={state === "inactive"}
            accessibilityLabel={label}
            testID={testID ? `${testID}-${id}` : undefined}
            isFull
          >
            {label}
          </TileButton>
        );
      })}
    </Box>
  );
}
