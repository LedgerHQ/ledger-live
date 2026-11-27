import type { Account } from "@ledgerhq/types-live";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import perFamilyManageAssetsAction from "~/generated/manageAssetsAction";

export type AccountDetailNavigation = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList>
>;

/** A family's token management. The new account screen's settings show "Manage assets" when `canManage` is true. */
export type ManageAssetsAction = {
  canManage: (account: Account) => boolean;
  open: (args: { account: Account; navigation: AccountDetailNavigation }) => void;
};

function hasManageAssetsAction(family: string): family is keyof typeof perFamilyManageAssetsAction {
  return Object.hasOwn(perFamilyManageAssetsAction, family);
}

export function getManageAssetsAction(family: string): ManageAssetsAction | undefined {
  return hasManageAssetsAction(family) ? perFamilyManageAssetsAction[family] : undefined;
}
