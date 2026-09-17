import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { HISTORY_TAB_CARD } from "LLM/features/OperationsHistory/constants";

export function navigateToCardHistory(
  navigation: Pick<NavigationProp<ParamListBase>, "navigate">,
): void {
  navigation.navigate(NavigatorName.OperationsHistory, {
    screen: ScreenName.OperationsList,
    params: { historyTab: HISTORY_TAB_CARD },
  });
}
