import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";

import { NavigatorName, ScreenName } from "~/const";

export function handleBackToLwEntryPoint(
  navigation: RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>,
  screen: ScreenName | NavigatorName.CardTab,
  params?: Record<string, unknown>,
) {
  switch (screen) {
    case ScreenName.ExchangeBuy:
    case ScreenName.ExchangeSell:
      navigation.navigate(NavigatorName.Exchange, {
        screen,
        params,
      });
      break;
    case ScreenName.Card:
      navigation.navigate(NavigatorName.Card, {
        screen,
        params,
      });
      break;
    case NavigatorName.CardTab:
      navigation.navigate(NavigatorName.Main, {
        screen,
      });
      break;
    default:
      navigation.navigate(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
  }
}
