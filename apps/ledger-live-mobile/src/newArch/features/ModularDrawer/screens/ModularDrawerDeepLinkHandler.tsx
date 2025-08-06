import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo } from "react";
import { NavigatorName, ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer/hooks/useModularDrawerController";
import { ModularDrawerNavigatorStackParamList } from "~/components/RootNavigator/types/ModularDrawerNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

export type ModularDrawerDeepLinkHandlerProps = StackNavigatorProps<
  ModularDrawerNavigatorStackParamList,
  ScreenName.ModularDrawerDeepLinkHandler
>;

export function ModularDrawerDeepLinkHandler({ route }: ModularDrawerDeepLinkHandlerProps) {
  const { currency } = route.params || {};
  const navigation = useNavigation();
  const { openDrawer } = useModularDrawerController();

  const currencies = useMemo(() => listAndFilterCurrencies({ includeTokens: true }), []);

  const currencyToAdd = currency ? findCryptoCurrencyByKeyword(currency) : undefined;

  useEffect(() => {
    navigation.navigate(NavigatorName.WalletTab, {
      screen: ScreenName.Portfolio,
    });

    openDrawer({
      currencies: currencyToAdd ? [currencyToAdd] : currencies,
      flow: "add-account",
      source: "deeplink",
    });
  }, [currencies, currencyToAdd, navigation, openDrawer]);

  return null;
}
