import type { RecentAddress as RecentAddressType } from "@ledgerhq/live-common/flows/send/recipient/types";
import {
  Tile,
  TileContent,
  TileDescription,
  TileSpot,
  TileTitle,
} from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { useRecentAddressDisplay } from "../hooks/useRecentAddressDisplay";

interface RecentAddressProps {
  recentAddress: RecentAddressType;
  onSelect: () => void;
  onLongPress: (recentAddress: RecentAddressType) => void;
}

export function RecentAddress({
  recentAddress,
  onSelect,
  onLongPress,
}: Readonly<RecentAddressProps>) {
  const { icon, displayName, dateText } = useRecentAddressDisplay(recentAddress);

  return (
    <Tile
      appearance="no-background"
      onPress={onSelect}
      onLongPress={() => onLongPress(recentAddress)}
      lx={{ width: "s112" }}
    >
      <TileSpot size={48} appearance="icon" icon={icon} />
      <TileContent>
        <TileTitle ellipsizeMode="middle" typography="body2SemiBold">
          {displayName}
        </TileTitle>
        <TileDescription typography="body3">{dateText}</TileDescription>
      </TileContent>
    </Tile>
  );
}
