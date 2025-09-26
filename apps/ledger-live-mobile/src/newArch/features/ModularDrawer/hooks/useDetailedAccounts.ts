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
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useModularDrawerAnalytics, MODULAR_DRAWER_PAGE_NAME } from "../analytics";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import {
  getAccountTuplesForCurrency,
  AccountTuple,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { AccountLike } from "@ledgerhq/types-live";
import { calculate } from "@ledgerhq/live-countervalues/logic";

// Extended account type that includes raw data for UI formatting
export type RawDetailedAccount = {
  id: string;
  name: string;
  ticker: string;
  account: AccountLike;
  parentAccount?: AccountLike;
  protocol?: string;
  parentId?: string;
};

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  flow: string,
  source: string,
  onAccountSelected: ((account: AccountLike, parentAccount?: AccountLike) => void) | undefined,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
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

  const detailedAccounts = useMemo((): RawDetailedAccount[] => {
    const accountNameMap = keyBy(
      accounts
        .map(({ account }, index) => ({
          id: account.id,
          name: overridedAccountName[index],
        }))
        .filter(item => item.name),
      "id",
    );

    const rawAccounts = accounts.map(tuple => {
      const account = tuple.account;
      const protocol = getTagDerivationMode(account.currency, account.derivationMode) ?? "";

      if (isATokenCurrency && tuple.subAccount) {
        const parentAccountName = accountNameMap[account.id]?.name;
        const details = tuple.subAccount.token;
        return {
          id: tuple.subAccount.id,
          name: parentAccountName ?? details.name,
          ticker: details.ticker,
          account: tuple.subAccount,
          parentAccount: account,
          parentId: details.parentCurrency.id,
        };
      } else {
        const accountName = accountNameMap[account.id]?.name;
        const details = account.currency;
        return {
          id: account.id,
          name: accountName ?? details.name,
          ticker: details.ticker,
          account,
          protocol,
        };
      }
    });

    // Sort by fiat value instead of balance
    return rawAccounts.sort((a, b) => {
      const fiatValueA = calculateFiatValue(a.account);
      const fiatValueB = calculateFiatValue(b.account);
      return fiatValueB - fiatValueA; // Descending order
    });
  }, [accounts, isATokenCurrency, overridedAccountName, calculateFiatValue]);

  const handleAccountSelected = useCallback(
    (rawAccount: RawDetailedAccount) => {
      trackModularDrawerEvent("account_clicked", {
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
        flow,
        source,
        currency: asset.ticker,
      });

      onAccountSelected?.(rawAccount.account, rawAccount.parentAccount);
    },
    [trackModularDrawerEvent, flow, source, asset.ticker, onAccountSelected],
  );

  return { detailedAccounts, accounts, handleAccountSelected };
};
