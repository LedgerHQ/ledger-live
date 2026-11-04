import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

const addAssetAction = (
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
) => {
  navigation.navigate(NavigatorName.AlgorandOptInFlow, {
    screen: ScreenName.AlgorandOptInSelectToken,
    params: { accountId },
  });
};

export default addAssetAction;
