import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  AccountTuple,
  getAccountTuplesForCurrency,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";
import { RawDetailedAccount } from "../utils/formatDetailedAccount";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../analytics/modularDrawer.types";
import { useOpenAssetFlow } from "./useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import orderBy from "lodash/orderBy";
import keyBy from "lodash/keyBy";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";
import { calculate } from "@ledgerhq/live-countervalues/logic";

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  accounts$?: Observable<WalletAPIAccount[]>,
  onAccountSelected?: (account: Account) => void,
) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const source = useSelector(modularDrawerSourceSelector);
  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    source,
  );

  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
    return orderBy(accountTuples, [(tuple: AccountTuple) => tuple.account.balance], ["desc"]);
  }, [asset, nestedAccounts, accountIds]);

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  // Helper function to calculate fiat value for an account
  const calculateFiatValue = useCallback(
    (account: AccountLike): number => {
      const currency = account.type === "Account" ? account.currency : account.token;
      const fiatValue = calculate(state, {
        from: currency,
        to: counterValueCurrency,
        value: account.balance.toNumber(),
      });
      return fiatValue || 0;
    },
    [state, counterValueCurrency],
  );

  const detailedAccounts: RawDetailedAccount[] = useMemo(() => {
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

      if (isATokenCurrency && tuple.subAccount) {
        const parentAccountName = accountNameMap[account.id]?.name;
        const details = tuple.subAccount.token;
        return {
          name: parentAccountName ?? details.name,
          id: tuple.subAccount.id,
          ticker: details.ticker,
          balance: tuple.subAccount.balance,
          balanceUnit: tuple.subAccount.token.units[0],
          address: account.freshAddress,
          cryptoId: details.id,
          parentId: details.parentCurrency.id,
          fiatValue: calculateFiatValue(tuple.subAccount),
        };
      } else {
        const accountName = accountNameMap[account.id]?.name;
        const details = account.currency;
        return {
          name: accountName ?? details.name,
          id: account.id,
          ticker: details.ticker,
          balance: account.balance,
          balanceUnit: account.currency.units[0],
          address: account.freshAddress,
          cryptoId: details.id,
          fiatValue: calculateFiatValue(account),
        };
      }
    });

    return sortAccountsByFiatValue(formattedAccounts);
  }, [accounts, isATokenCurrency, overridedAccountName, calculateFiatValue]);

  const onAddAccountClick = useCallback(() => {
    trackModularDrawerEvent("button_clicked", {
      button: "Add a new account",
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    });
    openAddAccountFlow(asset, false, onAccountSelected);
  }, [asset, openAddAccountFlow, trackModularDrawerEvent, onAccountSelected]);

  return { detailedAccounts, accounts, onAddAccountClick };
};
