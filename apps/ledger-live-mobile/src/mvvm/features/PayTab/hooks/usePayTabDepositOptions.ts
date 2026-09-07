import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";
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
  const navigation = useNavigation();
  const { bottom: bottomInset } = useSafeAreaInsets();

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

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
    onTrackEvent,
  });

  return { open, depositOptions: { ...depositOptions, bottomInset } };
}
