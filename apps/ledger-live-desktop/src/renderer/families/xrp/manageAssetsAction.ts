import { AccountIdSchema } from "@domain/entity-account";
import { getManagedTokenAccounts } from "@ledgerhq/live-common/families/xrp/tokens";
import type { XrpFamily } from "./types";
import { openXrpDialog } from "./xrpDialog";

const manageAssetsAction: NonNullable<XrpFamily["manageAssetsAction"]> = {
  canManage: account => getManagedTokenAccounts(account).length > 0,
  open: ({ account, dispatch }) => {
    dispatch(openXrpDialog(AccountIdSchema.parse(account.id), { screen: "manageAssets" }));
  },
};

export default manageAssetsAction;
