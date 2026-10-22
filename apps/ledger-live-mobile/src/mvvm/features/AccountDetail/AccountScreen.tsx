import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountDetailFeature } from "@features/flow-account-detail";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import LegacyAccount from "~/screens/Account";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import AccountDetailNavigator from "./Navigator";

type Props =
  | StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Account>
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

export default function AccountScreen(props: Props) {
  const { account, parentAccount } = useAccountScreen(props.route);
  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;
  const isAccountDetailEnabled = useAccountDetailFeature(mainAccount?.currency.id);

  if (isAccountDetailEnabled && mainAccount) {
    return <AccountDetailNavigator accountId={mainAccount.id} />;
  }
  return <LegacyAccount {...props} />;
}
