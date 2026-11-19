/** `pay` is only offered on web: the native view does not render it. */
export type ActionTileId = "deposit" | "request" | "pay";

/** Host-provided tile: copy is resolved by the platform view from the tile `id`. */
export type ActionTileInput = Readonly<{
  id: ActionTileId;
  onOpenFlow: () => void;
  /** @platform web */
  appearance?: "base" | "transparent";
}>;

export type ActionTilesProps = Readonly<{
  tiles: readonly ActionTileInput[];
  page: string;
}>;

export type ActionTilesViewProps = Readonly<{
  tiles: readonly ActionTileInput[];
}>;
