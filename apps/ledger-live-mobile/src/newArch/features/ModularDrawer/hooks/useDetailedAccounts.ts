import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import orderBy from "lodash/orderBy";
import keyBy from "lodash/keyBy";
import BigNumber from "bignumber.js";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useModularDrawerAnalytics, MODULAR_DRAWER_PAGE_NAME } from "../analytics";
import { formatDetailedAccount } from "../utils/formatdetailedAccount";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/core";
import {
  getAccountTuplesForCurrency,
  AccountTuple,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { AccountUI } from "@ledgerhq/native-ui/lib/pre-ldls/index";
import { AccountLike } from "@ledgerhq/types-live";

export const sortAccountsByBalance = (
  a: { balance: BigNumber } | undefined,
  b: { balance: BigNumber } | undefined,
) => {
  if (a && b) return b.balance.comparedTo(a.balance);
  if (a) return -1;
  if (b) return 1;
  return 0;
};

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  flow: string,
  source: string,
  onAccountSelected: ((account: AccountLike, parentAccount?: AccountLike) => void) | undefined,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const state = useCountervaluesState();
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const navigation = useNavigation();
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
    return orderBy(accountTuples, [(tuple: AccountTuple) => tuple.account.balance], ["desc"]);
  }, [asset, nestedAccounts, accountIds]);

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  const detailedAccounts = useMemo(() => {
    const accountNameMap = keyBy(
      accounts
        .map(({ account }, index) => ({
          id: account.id,
          name: overridedAccountName[index],
        }))
        .filter(item => item.name),
      "id",
    );

    const formattedAccounts = accounts.map(tuple => {
      const account = tuple.account;
      const protocol = getTagDerivationMode(account.currency, account.derivationMode) ?? "";
      const currencyAccount = formatDetailedAccount(
        account,
        account.freshAddress,
        state,
        counterValueCurrency,
      );

      if (isATokenCurrency && tuple.subAccount) {
        const formattedSubAccount = formatDetailedAccount(
          tuple.subAccount,
          account.freshAddress,
          state,
          counterValueCurrency,
        );
        const parentAccountName = accountNameMap[account.id]?.name;
        return {
          ...formattedSubAccount,
          name: parentAccountName ?? formattedSubAccount.name,
        };
      } else {
        const accountName = accountNameMap[account.id]?.name;
        return {
          ...currencyAccount,
          protocol,
          name: accountName ?? currencyAccount.name,
        };
      }
    });

    return sortAccountsByFiatValue(formattedAccounts);
  }, [accounts, state, counterValueCurrency, isATokenCurrency, overridedAccountName]);

  const handleAccountSelected = useCallback(
    (account: AccountUI) => {
      const specificAccount = accounts.find(tuple => tuple.account.id === account.id)?.account;

      trackModularDrawerEvent("account_clicked", {
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
        flow,
        source,
        currency: asset.ticker,
      });
      if (onAccountSelected && specificAccount) {
        onAccountSelected?.(specificAccount);
      } else {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Account,
          params: {
            currencyId: asset.id,
            accountId: account.id,
          },
        });
      }
    },
    [
      accounts,
      trackModularDrawerEvent,
      flow,
      source,
      asset.ticker,
      asset.id,
      onAccountSelected,
      navigation,
    ],
  );

  return { detailedAccounts, accounts, handleAccountSelected };
};
