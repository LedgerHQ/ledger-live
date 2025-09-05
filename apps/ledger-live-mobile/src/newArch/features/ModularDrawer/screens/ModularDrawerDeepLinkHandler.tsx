import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { NavigatorName, ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer/hooks/useModularDrawerController";
import { ModularDrawerNavigatorStackParamList } from "~/components/RootNavigator/types/ModularDrawerNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";

export type ModularDrawerDeepLinkHandlerProps = StackNavigatorProps<
  ModularDrawerNavigatorStackParamList,
  ScreenName.ModularDrawerDeepLinkHandler
>;

export function ModularDrawerDeepLinkHandler({ route }: ModularDrawerDeepLinkHandlerProps) {
  const { currency } = route.params || {};
  const navigation = useNavigation();
  const { openDrawer } = useModularDrawerController();

  const currencyToAdd = currency ? findCryptoCurrencyByKeyword(currency) : undefined;

  useEffect(() => {
    navigation.navigate(NavigatorName.WalletTab, {
      screen: ScreenName.Portfolio,
    });

    openDrawer({
      currencies: currencyToAdd ? [currencyToAdd.id] : undefined,
      flow: "add-account",
      source: "deeplink",
    });
  }, [currencyToAdd, navigation, openDrawer]);

  return null;
}
