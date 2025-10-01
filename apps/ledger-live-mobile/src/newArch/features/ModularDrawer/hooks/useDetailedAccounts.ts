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
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useModularDrawerAnalytics, MODULAR_DRAWER_PAGE_NAME } from "../analytics";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import {
  getAccountTuplesForCurrency,
  AccountTuple,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { AccountLike } from "@ledgerhq/types-live";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { formatAddress } from "../../Accounts/utils/formatAddress";

// Extended account type that includes raw data for UI formatting
export type RawDetailedAccount = {
  id: string;
  name: string;
  ticker: string;
  account: AccountLike;
  parentAccount?: AccountLike;
  protocol?: string;
  parentId?: string;
  fiatValue: string;
  balance: string;
  address: string;
  cryptoId: string;
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
  const discreet = useSelector(discreetModeSelector);

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
      const { account, subAccount } = tuple;
      const protocol = getTagDerivationMode(account.currency, account.derivationMode) ?? "";
      const address = formatAddress(account.freshAddress);

      if (isATokenCurrency && subAccount) {
        const parentAccountName = accountNameMap[account.id]?.name;
        const details = subAccount.token;

        const fiatValue = formatCurrencyUnit(
          counterValueCurrency.units[0],
          BigNumber(calculateFiatValue(subAccount)),
          { showCode: true, discreet },
        );

        const balance = formatCurrencyUnit(subAccount.token.units[0], subAccount.balance, {
          showCode: true,
          discreet,
        });

        const cryptoId = subAccount.token.id;

        return {
          id: subAccount.id,
          name: parentAccountName ?? details.name,
          ticker: details.ticker,
          account: subAccount,
          parentAccount: account,
          parentId: details.parentCurrency.id,
          fiatValue,
          balance,
          address,
          cryptoId,
        };
      } else {
        const accountName = accountNameMap[account.id]?.name;
        const details = account.currency;

        const fiatValue = formatCurrencyUnit(
          counterValueCurrency.units[0],
          BigNumber(calculateFiatValue(account)),
          { showCode: true, discreet },
        );

        const balance = formatCurrencyUnit(account.currency.units[0], account.balance, {
          showCode: true,
          discreet,
        });

        const cryptoId = account.currency.id;

        return {
          id: account.id,
          name: accountName ?? details.name,
          ticker: details.ticker,
          account,
          protocol,
          fiatValue,
          balance,
          address,
          cryptoId,
        };
      }
    });

    // Sort by fiat value instead of balance
    return rawAccounts.sort((a, b) => {
      const fiatValueA = calculateFiatValue(a.account);
      const fiatValueB = calculateFiatValue(b.account);
      return fiatValueB - fiatValueA; // Descending order
    });
  }, [
    accounts,
    overridedAccountName,
    isATokenCurrency,
    counterValueCurrency.units,
    calculateFiatValue,
    discreet,
  ]);

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
