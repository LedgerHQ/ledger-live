import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { shallowEqual } from "react-redux";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useSelector } from "~/context/hooks";
import { walletSelector } from "~/reducers/wallet";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";

export type AddressAccountData = Readonly<{
  id: string;
  account: Account;
  name: string;
  truncatedAddress: string;
}>;

export function useAddressesViewModel(currency: CryptoCurrency | undefined) {
  const navigation = useNavigation();
  const walletState = useSelector(walletSelector);

  const accountsSelector = useMemo(
    () => (currency ? accountsByCryptoCurrencyScreenSelector(currency) : () => []),
    [currency],
  );
  const accountTuples = useSelector(accountsSelector, shallowEqual);

  const accounts: AddressAccountData[] = useMemo(() => {
    if (!currency) return [];
    return accountTuples.map(tuple => {
      const acc = tuple.subAccount ?? tuple.account;
      const mainAccount = tuple.account as Account;
      return {
        id: acc.id,
        account: mainAccount,
        name: tuple.name || accountNameWithDefaultSelector(walletState, mainAccount),
        truncatedAddress: formatAddress(mainAccount.freshAddress, {
          prefixLength: 4,
          suffixLength: 4,
        }),
      };
    });
  }, [currency, accountTuples, walletState]);

  const onAccountPress = useCallback(
    (account: Account) => {
      track("account_clicked", {
        currency: currency?.id,
        accountId: account.id,
        page: "Asset Detail",
      });
      navigation.navigate(ScreenName.Account, {
        accountId: account.id,
      });
    },
    [navigation, currency?.id],
  );

  const onAddAccount = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "add_account",
      currency: currency.id,
      page: "Asset Detail",
    });
    navigation.navigate(NavigatorName.DeviceSelection, {
      screen: ScreenName.SelectDevice,
      params: {
        currency,
        context: AddAccountContexts.AddAccounts,
      },
    });
  }, [navigation, currency]);

  return {
    accounts,
    onAccountPress,
    onAddAccount,
  };
}
