import { useMemo } from "react";
import type { ActionTilesProps, ActionTilesViewProps } from "./types";

export function useActionTilesViewModel({
  tiles,
  page,
  onTrackEvent,
}: ActionTilesProps): ActionTilesViewProps {
  const trackedTiles = useMemo(
    () =>
      tiles.map(tile => ({
        ...tile,
        onPress: () => {
          onTrackEvent?.("button_clicked", {
            button: tile.id,
            buttonLocation: "quick_action",
            page,
          });
          tile.onPress();
        },
      })),
    [tiles, page, onTrackEvent],
  );

  return { tiles: trackedTiles };
}
