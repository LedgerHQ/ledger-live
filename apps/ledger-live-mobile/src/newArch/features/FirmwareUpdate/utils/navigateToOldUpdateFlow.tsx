import { ParamListBase, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenName, NavigatorName } from "~/const";

export function navigateToOldUpdateFlow({
  route,
  navigation,
}: {
  route: RouteProp<ParamListBase>;
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}) {
  if (route.name === ScreenName.MyLedgerDevice) {
    // if we're already in the manager page, only update the params
    navigation.setParams({ firmwareUpdate: true });
  } else {
    navigation.navigate(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
      params: { firmwareUpdate: true },
    });
  }
}
