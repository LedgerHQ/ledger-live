import { getManagedTokenAccounts } from "@ledgerhq/live-common/families/xrp/tokens";
import { NavigatorName, ScreenName } from "~/const";
import type { ManageAssetsAction } from "LLM/features/AccountDetail/utils/manageAssetsAction";

const manageAssetsAction: ManageAssetsAction = {
  canManage: account => getManagedTokenAccounts(account).length > 0,
  open: ({ account, navigation }) => {
    navigation.navigate(NavigatorName.XrpManageTokenFlow, {
      screen: ScreenName.XrpManageTokenList,
      params: { accountId: account.id },
    });
  },
};

export default manageAssetsAction;
