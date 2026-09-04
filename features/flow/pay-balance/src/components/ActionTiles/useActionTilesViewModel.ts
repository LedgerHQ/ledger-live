import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { ActionTilesProps, ActionTilesViewProps } from "./types";

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
            button: tile.id,
            buttonLocation: "quick_action",
            page,
          });
          tile.onPress();
        },
      })),
    [t, tiles, page, onTrackEvent],
  );

  return { tiles: trackedTiles };
}
