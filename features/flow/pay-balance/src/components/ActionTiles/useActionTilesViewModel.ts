import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { ActionTilesProps, ActionTilesViewProps } from "./types";

const TRACK_BUTTON = {
  deposit: "deposit",
  request: "request",
  pay: "send",
} as const;

export function useActionTilesViewModel({
  tiles,
  page,
  onTrackEvent,
}: ActionTilesProps): ActionTilesViewProps {
  const { t } = useTranslation();

  const trackedTiles = useMemo(
    () =>
      tiles.map(tile => ({
        ...tile,
        label: t(`payTab.actions.${tile.id}`),
        onPress: () => {
          onTrackEvent?.("button_clicked", {
            button: TRACK_BUTTON[tile.id],
            buttonLocation: "quick action",
            page,
          });
          tile.onPress();
        },
      })),
    [t, tiles, page, onTrackEvent],
  );

  return { tiles: trackedTiles };
}
