import type { Route } from "@react-navigation/routers";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName, NavigatorName } from "~/const";

export function navigateToOldUpdateFlow({
  route,
  navigation,
}: {
  route: Route<string, object>;
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}) {
  if (route.name === ScreenName.MyLedgerDevice) {
    // if we're already in the manager page, only update the params
    navigation.setParams({ firmwareUpdate: true });
  } else {
    navigation.navigate(NavigatorName.MyLedger, {
      params: { firmwareUpdate: true },
    });
  }
}
