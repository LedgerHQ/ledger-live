import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  AccountTuple,
  getAccountTuplesForCurrency,
} from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";
import BigNumber from "bignumber.js";
import { formatDetailedAccount } from "../utils/formatDetailedAccount";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "../analytics/modularDrawer.types";
import { useOpenAssetFlow } from "./useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { Account } from "@ledgerhq/types-live";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import orderBy from "lodash/orderBy";
import keyBy from "lodash/keyBy";

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
  accounts$?: Observable<WalletAPIAccount[]>,
  onAccountSelected?: (account: Account) => void,
) => {
  const discreet = useDiscreetMode();
  const state = useCountervaluesState();
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    source,
  );

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
        discreet,
      );

      if (isATokenCurrency && tuple.subAccount) {
        const formattedSubAccount = formatDetailedAccount(
          tuple.subAccount,
          account.freshAddress,
          state,
          counterValueCurrency,
          discreet,
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
  }, [accounts, state, counterValueCurrency, discreet, isATokenCurrency, overridedAccountName]);

  const onAddAccountClick = useCallback(() => {
    trackModularDrawerEvent("button_clicked", {
      button: "Add a new account",
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
      flow,
      source,
    });
    openAddAccountFlow(asset, false, onAccountSelected);
  }, [asset, flow, openAddAccountFlow, source, trackModularDrawerEvent, onAccountSelected]);

  return { detailedAccounts, accounts, onAddAccountClick };
};
