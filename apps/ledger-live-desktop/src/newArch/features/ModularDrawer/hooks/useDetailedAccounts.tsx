import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Observable } from "rxjs";
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
import BigNumber from "bignumber.js";
import { formatDetailedAccount } from "../utils/formatDetailedAccount";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { useDiscreetMode } from "~/renderer/components/Discreet";

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
  const discreet = useDiscreetMode();
  const state = useCountervaluesState();

  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const isATokenCurrency = useMemo(() => isTokenCurrency(asset), [asset]);

  const accounts = useMemo(() => {
    const accountTuples = getAccountTuplesForCurrency(asset, nestedAccounts, false, accountIds);
    return accountTuples.sort((a, b) => sortAccountsByBalance(a.account, b.account));
  }, [asset, nestedAccounts, accountIds]);

  const detailedAccounts = useMemo(() => {
    const formattedAccounts = accounts.flatMap(tuple => {
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
        return [
          formatDetailedAccount(
            tuple.subAccount,
            account.freshAddress,
            state,
            counterValueCurrency,
            discreet,
          ),
        ];
      } else {
        return [{ ...currencyAccount, protocol }];
      }
    });

    return sortAccountsByFiatValue(formattedAccounts);
  }, [accounts, state, counterValueCurrency, discreet, isATokenCurrency]);

  const openAddAccountFlow = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      // HERE WE WILL BE ABLE TO CHANGE THE STEP TO GO TO THE ADD ACCOUNT FLOW
      // For now, we just open the modal
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
