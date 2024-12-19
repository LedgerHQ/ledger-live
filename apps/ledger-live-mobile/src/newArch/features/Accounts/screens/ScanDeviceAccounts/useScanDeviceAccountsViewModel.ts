import { useNavigation } from "@react-navigation/core";
import { useCallback, useState } from "react";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";
import { AccountLikeEnhanced } from "./types";

type NavigationProps = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, NavigatorName.AddAccounts>
>;

export default function useScanDeviceAccountsViewModel({
  context,
}: {
  context?: "addAccounts" | "receiveFunds";
}) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Record<string, BigNumber>>({});
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onSelectAccount = useCallback(
    (account: AccountLikeEnhanced) => {
      if (context === "addAccounts") {
        const currentAccountSelection = { ...selectedAccountIds };
        if (currentAccountSelection[account.id]) {
          delete currentAccountSelection[account.id];
          setSelectedAccountIds(currentAccountSelection);
        } else {
          setSelectedAccountIds({ ...currentAccountSelection, [account.id]: account.balance });
        }
      }
    },
    [selectedAccountIds, context],
  );

  const onFinishAccountsSelection = useCallback(
    (accountsToAdd: Partial<AccountLikeEnhanced>[]) => {
      // addAccounts only context -> go to success/warning screen
      // check whether there is at least one account with zero balance
      const hasZeroBalance = accountsToAdd.some(account => account.spendableBalance?.isZero());

      if (hasZeroBalance) {
        navigation.navigate(ScreenName.AddAccountsWarning, { accounts: [] });
      } else navigation.navigate(ScreenName.AddAccountsSuccess, { accounts: [] });
    },
    [navigation],
  );
  return {
    selectedAccountIds,
    onSelectAccount,
    onFinishAccountsSelection,
  };
}
