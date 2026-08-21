import { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import type { ActionTilesProps } from "@features/flow-pay-card-balance";

export function usePayTabActionTiles(
  onTrackEvent: ActionTilesProps["onTrackEvent"],
  onDeposit: () => void,
  onRequest: () => void,
): ActionTilesProps {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      tiles: [
        { id: "deposit", label: t("payTab.actions.deposit"), onPress: onDeposit },
        { id: "request", label: t("payTab.actions.request"), onPress: onRequest },
      ],
      page: "Pay",
      onTrackEvent,
    }),
    [t, onTrackEvent, onDeposit, onRequest],
  );
}
