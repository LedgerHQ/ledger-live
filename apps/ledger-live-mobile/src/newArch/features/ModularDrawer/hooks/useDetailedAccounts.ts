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
import { formatDetailedAccount } from "../utils/formatdetailedAccount";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import {
  getAccountTuplesForCurrency,
  AccountTuple,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { AccountUI } from "@ledgerhq/native-ui/lib/pre-ldls/index";
import { AccountLike } from "@ledgerhq/types-live";

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  flow: string,
  source: string,
  onAccountSelected: ((account: AccountLike, parentAccount?: AccountLike) => void) | undefined,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const state = useCountervaluesState();
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
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
      const isToken = Boolean(account.parentId);

      const matchedTuple = accounts.find(
        tuple => tuple.account.id === account.id || tuple.subAccount?.id === account.id,
      );

      const specificAccount = isToken ? matchedTuple?.subAccount : matchedTuple?.account;
      const parentAccount = isToken ? matchedTuple?.account : undefined;

      trackModularDrawerEvent("account_clicked", {
        page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
        flow,
        source,
        currency: asset.ticker,
      });

      if (specificAccount) {
        onAccountSelected?.(specificAccount, parentAccount);
        return;
      }
    },
    [accounts, trackModularDrawerEvent, flow, source, asset.ticker, onAccountSelected],
  );

  return { detailedAccounts, accounts, handleAccountSelected };
};
