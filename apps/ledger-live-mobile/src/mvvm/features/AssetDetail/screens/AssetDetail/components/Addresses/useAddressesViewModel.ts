import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useSelector } from "~/context/hooks";
import { walletSelector } from "~/reducers/wallet";
import { accountsSelector } from "~/reducers/accounts";
import { useSortAccountsComparator } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { buildMainAccountByIdMap } from "@ledgerhq/asset-aggregation/assetDistribution/index";

export type AddressAccountData = Readonly<{
  id: string;
  account: Account;
  balanceAccount: AccountLike;
  name: string;
  truncatedAddress: string;
}>;

export function useAddressesViewModel(
  currency: AssetDetailCurrencyProps,
  distributionItem: DistributionItem | undefined,
) {
  const navigation = useNavigation();
  const walletState = useSelector(walletSelector);
  const allAccounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();

  const mainAccountById = useMemo(() => buildMainAccountByIdMap(allAccounts), [allAccounts]);

  const sortedAccounts = useMemo(() => {
    if (!distributionItem) return [];
    return [...distributionItem.accounts].sort(comparator);
  }, [distributionItem, comparator]);

  const accounts: AddressAccountData[] = useMemo(() => {
    if (!currency || !distributionItem) return [];
    return sortedAccounts.flatMap(acc => {
      const parent =
        acc.type === "TokenAccount" ? mainAccountById.get(acc.parentId) : (acc as Account);
      if (!parent) return [];
      return [
        {
          id: acc.id,
          account: parent,
          balanceAccount: acc,
          name: accountNameWithDefaultSelector(walletState, parent),
          truncatedAddress: formatAddress(parent.freshAddress, {
            prefixLength: 4,
            suffixLength: 4,
          }),
        },
      ];
    });
  }, [currency, distributionItem, sortedAccounts, mainAccountById, walletState]);

  const onAddAccount = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "add_account",
      currency: currency.id,
      page: "Asset Detail",
    });
    const cryptoCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
    navigation.navigate(NavigatorName.DeviceSelection, {
      screen: ScreenName.SelectDevice,
      params: {
        currency: cryptoCurrency,
        context: AddAccountContexts.AddAccounts,
      },
    });
  }, [navigation, currency]);

  return {
    accounts,
    onAddAccount,
  };
}
