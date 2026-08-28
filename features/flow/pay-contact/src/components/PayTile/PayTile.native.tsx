import React from "react";
import { Spot, Tile, TileContent, TileTitle } from "@ledgerhq/lumen-ui-rnative";
import { Telegram } from "@ledgerhq/lumen-ui-rnative/symbols";

type PayTileProps = Readonly<{
  label: string;
  onPress: () => void;
}>;

export function PayTile({ label, onPress }: PayTileProps): React.JSX.Element {
  return (
    <Tile
      onPress={onPress}
      lx={{ width: "s96", flexGrow: 1, marginLeft: "-s8" }}
      testID="pay-contacts-pay-tile"
      accessibilityRole="button"
      accessibilityLabel={label}
      centered
    >
      <Spot size={56} appearance="icon" icon={Telegram} />
      <TileContent>
        <TileTitle lx={{ color: "muted" }}>{label}</TileTitle>
      </TileContent>
    </Tile>
  );
}
