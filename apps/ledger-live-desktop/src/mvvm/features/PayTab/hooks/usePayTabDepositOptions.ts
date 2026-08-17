import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type DepositOptionsLabels,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-card-deposit";
import { useOpenAssetFlow } from "../../ModularDialog/hooks/useOpenAssetFlow";

const DEPOSIT_PAGE = "Pay";

export type UsePayTabDepositOptions = UseDepositOptionsAdapter;

export function usePayTabDepositOptions(
  onTrackEvent: PayCardTrackEvent | undefined,
  stablecoinCurrencyIds: string[],
): UsePayTabDepositOptions {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    DEPOSIT_PAGE,
    "MODAL_RECEIVE",
  );

  const onSelect = useCallback(
    (id: DepositOptionId) => {
      switch (id) {
        case "bankTransfer":
          navigate("/bank");
          break;
        case "swap":
          navigate("/swap");
          break;
        case "buy":
          navigate("/exchange", { state: { mode: "buy", returnTo: "/paytab" } });
          break;
        case "receive":
          openAssetFlow(undefined, stablecoinCurrencyIds);
          break;
      }
    },
    [navigate, openAssetFlow, stablecoinCurrencyIds],
  );

  const labels: DepositOptionsLabels = {
    title: t("payTab.deposit.title"),
    options: {
      bankTransfer: {
        title: t("payTab.deposit.options.bankTransfer.title"),
        description: t("payTab.deposit.options.bankTransfer.description"),
      },
      swap: {
        title: t("payTab.deposit.options.swap.title"),
        description: t("payTab.deposit.options.swap.description"),
      },
      receive: {
        title: t("payTab.deposit.options.receive.title"),
        description: t("payTab.deposit.options.receive.description"),
      },
      buy: {
        title: t("payTab.deposit.options.buy.title"),
        description: t("payTab.deposit.options.buy.description"),
      },
    },
  };

  return useDepositOptionsAdapter({ labels, page: DEPOSIT_PAGE, onSelect, onTrackEvent });
}
