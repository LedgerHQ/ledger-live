import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ActionTilesProps } from "@features/flow-pay-card-balance";

const noop = () => {};

export function usePayTabActionTiles(
  onTrackEvent: ActionTilesProps["onTrackEvent"],
  onDeposit: () => void,
  onRequest: () => void,
): ActionTilesProps {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      tiles: [
        {
          id: "deposit",
          label: t("payTab.actions.deposit"),
          onPress: onDeposit,
          appearance: "base",
        },
        {
          id: "request",
          label: t("payTab.actions.request"),
          onPress: onRequest,
          appearance: "transparent",
        },
        { id: "pay", label: t("payTab.actions.pay"), onPress: noop, appearance: "transparent" },
      ],
      page: "Pay",
      onTrackEvent,
    }),
    [t, onTrackEvent, onDeposit, onRequest],
  );
}
