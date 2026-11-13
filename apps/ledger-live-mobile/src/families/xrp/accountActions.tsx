import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";

function getManageAssetsNavigation(account: Account): NavigationParamsType | undefined {
  if (getXrpEnabledTokenStandards(account.currency.id).length === 0) return undefined;

  return [
    NavigatorName.XrpManageTokenFlow,
    { screen: ScreenName.XrpManageTokenManage, params: { accountId: account.id } },
  ];
}

export default {
  getManageAssetsNavigation,
};
