export type ActionTileId = "deposit" | "request" | "pay";

/** Host-provided tile: copy is resolved inside the feature from the tile `id`. */
export type ActionTileInput = Readonly<{
  id: ActionTileId;
  onPress: () => void;
  appearance?: "base" | "transparent";
}>;

/** A tile with its resolved copy, consumed by the views. */
export type ActionTile = ActionTileInput & Readonly<{ label: string }>;

export type ActionTilesProps = Readonly<{
  tiles: readonly ActionTileInput[];
  page: string;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type ActionTilesViewProps = Readonly<{
  tiles: readonly ActionTile[];
}>;
