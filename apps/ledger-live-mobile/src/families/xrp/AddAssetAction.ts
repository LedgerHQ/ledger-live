import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { navigateToAddToken } from "./utils";

function addAssetAction(navigation: NativeStackNavigationProp<ParamListBase>, accountId: string) {
  navigateToAddToken(navigation, accountId);
}

addAssetAction.isAvailable = (account: Account) => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

export default addAssetAction;
