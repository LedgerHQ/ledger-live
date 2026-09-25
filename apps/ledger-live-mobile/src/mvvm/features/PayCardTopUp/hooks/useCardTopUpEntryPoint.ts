import { useCallback } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { NavigatorName, ScreenName } from "~/const";
import type { CardTopUpParams } from "../types";

export function useCardTopUpEntryPoint(): (asset: CardAssetRow) => void {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { openDrawer } = useModularDrawerController();

  return useCallback(
    ({ address, currency, ticker, ledgerId }: CardAssetRow) => {
      openDrawer({
        currencies: [ledgerId],
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        uiUseCase: "pay-card-top-up",
        onAccountSelected: account => {
          const params: CardTopUpParams = {
            accountId: account.id,
            destination: { address, currency, ticker, ledgerId },
          };
          navigation.navigate(NavigatorName.Base, { screen: ScreenName.PayCardTopUp, params });
        },
      });
    },
    [navigation, openDrawer],
  );
}
