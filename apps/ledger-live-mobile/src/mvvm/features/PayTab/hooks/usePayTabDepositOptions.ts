import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type DepositOptionsLabels,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-card-deposit";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenBuySell } from "LLM/features/Buy";

const DEPOSIT_PAGE = "Pay";
const FIAT_PROVIDER_MANIFEST_ID = "noah";

const DEPOSIT_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabDepositOptions = UseDepositOptionsAdapter;

export function usePayTabDepositOptions(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabDepositOptions {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    categories: DEPOSIT_CATEGORIES,
    sourceScreenName: DEPOSIT_PAGE,
    fromMenu: true,
  });
  const { handleOpenSwap } = useOpenSwap({ sourceScreenName: DEPOSIT_PAGE });
  const { handleOpenBuySell } = useOpenBuySell({ sourceScreenName: DEPOSIT_PAGE });

  const onSelect = useCallback(
    (id: DepositOptionId) => {
      switch (id) {
        case "bankTransfer":
          navigation.navigate(NavigatorName.ReceiveFunds, {
            screen: ScreenName.ReceiveProvider,
            params: { manifestId: FIAT_PROVIDER_MANIFEST_ID, fromMenu: true },
          });
          break;
        case "swap":
          handleOpenSwap();
          break;
        case "buy":
          handleOpenBuySell("buy");
          break;
        case "receive":
          handleOpenReceiveDrawer();
          break;
      }
    },
    [navigation, handleOpenSwap, handleOpenBuySell, handleOpenReceiveDrawer],
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
