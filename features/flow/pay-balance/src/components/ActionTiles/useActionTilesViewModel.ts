import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import type { ActionTilesProps, ActionTilesViewProps } from "./types";

const TRACK_BUTTON = {
  deposit: "deposit",
  request: "request",
  pay: "send",
} as const;

export function useActionTilesViewModel({ tiles, page }: ActionTilesProps): ActionTilesViewProps {
  const { t } = useTranslation();

  const trackedTiles = useMemo(
    () =>
      tiles.map(tile => ({
        ...tile,
        label: t(`payTab.actions.${tile.id}`),
        onOpenFlow: () => {
          trackButtonClicked({
            button: TRACK_BUTTON[tile.id],
            buttonLocation: "quick action",
            page,
          });
          tile.onOpenFlow();
        },
      })),
    [t, tiles, page],
  );

  return { tiles: trackedTiles };
}
