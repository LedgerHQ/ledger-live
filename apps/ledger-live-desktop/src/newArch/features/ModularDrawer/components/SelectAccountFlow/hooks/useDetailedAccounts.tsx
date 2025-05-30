import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Observable } from "rxjs";
import { TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";
import { getTokenAccountTuples } from "LLD/utils/getTokenAccountTuples";
import BigNumber from "bignumber.js";
import { formatDetailedAccount } from "../utils/formatDetailedAccount";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";

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
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const dispatch = useDispatch();
  const state = useCountervaluesState();

  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const getTokenAccounts = useCallback(() => {
    const tokenAccountTuples = getTokenAccountTuples(asset, nestedAccounts);
    const isTokenAccountTuple = (tuple: {
      subAccount?: TokenAccount;
    }): tuple is { subAccount: TokenAccount } => tuple.subAccount !== undefined;
    return tokenAccountTuples
      .filter(isTokenAccountTuple)
      .sort((a, b) => sortAccountsByBalance(a.subAccount, b.subAccount));
  }, [asset, nestedAccounts]);

  const getRegularAccounts = useCallback(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts, false, accountIds);
    return accountTuples.sort((a, b) => sortAccountsByBalance(a.account, b.account));
  }, [asset, nestedAccounts, accountIds]);

  const accounts = useMemo(() => {
    if (isATokenCurrency) {
      return getTokenAccounts();
    }
    return getRegularAccounts();
  }, [isATokenCurrency, getRegularAccounts, getTokenAccounts]);

  const detailedAccounts = useMemo(() => {
    const formattedAccounts = accounts.flatMap(tuple => {
      const account = tuple.account;
      const protocol = getTagDerivationMode(account.currency, account.derivationMode) || "";
      const currencyAccount = formatDetailedAccount(
        account,
        account.freshAddress,
        state,
        counterValueCurrency,
      );

      if (isATokenCurrency && tuple.subAccount) {
        return [
          formatDetailedAccount(
            tuple.subAccount,
            account.freshAddress,
            state,
            counterValueCurrency,
          ),
        ];
      } else {
        return [{ ...currencyAccount, protocol }];
      }
    });

    return sortAccountsByFiatValue(formattedAccounts);
  }, [accounts, state, counterValueCurrency, isATokenCurrency]);

  const openAddAccountFlow = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", currency ? { currency } : undefined));
      if (currency) {
        setDrawer();
      }
    },
    [dispatch],
  );

  const onAddAccountClick = useCallback(() => {
    track("button_clicked", {
      button: "Add a new account",
      page: "Modular Account Selection",
      flow,
    });
    openAddAccountFlow(asset);
  }, [asset, flow, openAddAccountFlow]);

  return { detailedAccounts, accounts, onAddAccountClick };
};
