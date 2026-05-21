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

export const MAX_PREVIEW_ADDRESSES = 5;

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

  const displayedAccounts = useMemo(() => accounts.slice(0, MAX_PREVIEW_ADDRESSES), [accounts]);

  const hasMore = accounts.length > MAX_PREVIEW_ADDRESSES;

  const allAccountIds = useMemo(
    () => Array.from(new Set(accounts.map(a => a.account.id))),
    [accounts],
  );

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

  const onSeeAll = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "see_all_addresses",
      currency: currency.id,
      page: "Asset Detail",
    });
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.CryptoAddresses,
      params: {
        sourceScreenName: ScreenName.AssetDetail,
        accountIds: allAccountIds,
        hideAddAccount: true,
      },
    });
  }, [navigation, currency, allAccountIds]);

  const onAccountPress = useCallback(
    (data: AddressAccountData) => {
      if (!currency) return;
      const { account, balanceAccount } = data;
      track("button_clicked", {
        button: "address",
        currency: currency.id,
        chain: account.currency.id,
        page: "Asset Detail",
      });
      const params =
        balanceAccount.type === "TokenAccount"
          ? {
              currencyId: account.currency.id,
              parentId: account.id,
              accountId: balanceAccount.id,
            }
          : { accountId: account.id };
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Account,
        params,
      });
    },
    [navigation, currency],
  );

  return {
    displayedAccounts,
    hasMore,
    hasData: displayedAccounts.length > 0,
    onAddAccount,
    onSeeAll,
    onAccountPress,
  };
}
