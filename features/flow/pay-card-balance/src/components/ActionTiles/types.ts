export type ActionTileId = "deposit" | "request" | "pay";

export type ActionTile = Readonly<{
  id: ActionTileId;
  label: string;
  onPress: () => void;
  appearance?: "base" | "transparent";
}>;

export type ActionTilesProps = Readonly<{
  tiles: readonly ActionTile[];
  page: string;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type ActionTilesViewProps = Readonly<{
  tiles: readonly ActionTile[];
}>;
