import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { NavigatorName, ScreenName } from "~/const";

export function navigateToCardHistory(
  navigation: Pick<NavigationProp<ParamListBase>, "navigate">,
  asset?: CardAssetRow,
): void {
  navigation.navigate(NavigatorName.OperationsHistory, {
    screen: ScreenName.OperationsList,
    params: { scope: asset ? { kind: "cardAsset", asset } : { kind: "pay" } },
  });
}
