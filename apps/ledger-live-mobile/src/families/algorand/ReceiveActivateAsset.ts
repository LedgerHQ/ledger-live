import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import addAssetAction from "./AddAssetAction";

/** The opt-in flow picks the asset itself: it cannot preselect the token yet. */
export default function receiveActivateAsset(
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
) {
  addAssetAction(navigation, accountId);
}
