import { useMemo } from "react";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import type { ActionTilesProps, ActionTilesViewProps } from "./types";

const TRACK_BUTTON = {
  deposit: "deposit",
  request: "request",
  pay: "send",
} as const;

export function useActionTilesViewModel({ tiles, page }: ActionTilesProps): ActionTilesViewProps {
  const trackedTiles = useMemo(
    () =>
      tiles.map(tile => ({
        ...tile,
        onOpenFlow: () => {
          trackButtonClicked({
            button: TRACK_BUTTON[tile.id],
            buttonLocation: "quick action",
            page,
          });
          tile.onOpenFlow();
        },
      })),
    [tiles, page],
  );

  return { tiles: trackedTiles };
}
