import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";

import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";

import {
  getBalanceHistoryWithCountervalue,
  getPortfolioCount,
} from "@ledgerhq/live-countervalues/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";

import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

import { Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";

const formatAddress = (address: string) => `${address.slice(0, 5)}...${address.slice(-5)}`;

const getBalanceAndFiatValue = (
  account: Account | TokenAccount,
  state: CounterValuesState,
  toCurrency: Currency,
) => {
  const details = account.type === "Account" ? account.currency : account.token;
  const balance = formatCurrencyUnit(details.units[0], account.balance, { showCode: true });

  const count = getPortfolioCount([account], "day");
  const { history } = getBalanceHistoryWithCountervalue(account, "day", count, state, toCurrency);
  const { countervalue } = history[history.length - 1] ?? {};
  const fiatValue = formatCurrencyUnit(toCurrency.units[0], BigNumber(countervalue || 0), {
    showCode: true,
  });

  return { balance, fiatValue };
};

const formatDetailedAccount = (
  account: Account | TokenAccount,
  parentAddress: string,
  state: CounterValuesState,
  to: Currency,
): DetailedAccount => {
  const details = account.type === "Account" ? account.currency : account.token;
  const parentId = account.type === "Account" ? undefined : account.token.parentCurrency.id;

  const { id } = account;
  const { name, ticker, id: cryptoId } = details;

  const { balance, fiatValue } = getBalanceAndFiatValue(account, state, to);
  const address = formatAddress(parentAddress);

  return { name, id, ticker, balance, fiatValue, address, cryptoId, parentId };
};

const getTokenAccountTuples = (asset: CryptoOrTokenCurrency, nestedAccounts: Account[]) => {
  return nestedAccounts
    .filter(account =>
      account.subAccounts?.some(
        subAcc => subAcc.token.id === asset.id || subAcc.token.id?.includes(asset.id),
      ),
    )
    .map(account => {
      const tokenSubAcc = account.subAccounts?.find(
        subAcc => subAcc.token.id === asset.id || subAcc.token.id?.includes(asset.id),
      );
      return { account, subAccount: tokenSubAcc };
    })
    .filter(tuple => !!tuple.subAccount);
};

const sortAccountsByBalance = (accounts: DetailedAccount[]) => {
  return [...accounts].sort((a, b) => {
    const numericBalanceA = a.balance.replace(/[^0-9.-]+/g, "");
    const numericBalanceB = b.balance.replace(/[^0-9.-]+/g, "");

    const balanceA = BigNumber(numericBalanceA);
    const balanceB = BigNumber(numericBalanceB);

    return balanceB.minus(balanceA).toNumber();
  });
};

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  flow: string,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();
  const dispatch = useDispatch();

  const accounts = useMemo(() => {
    if (asset.type === "TokenCurrency") {
      return getTokenAccountTuples(asset, nestedAccounts);
    }
    return getAccountTuplesForCurrency(asset, nestedAccounts, false, accountIds);
  }, [asset, nestedAccounts, accountIds]);

  const detailedAccounts = useMemo(() => {
    const formattedAccounts = accounts.flatMap(tuple => {
      const account = tuple.account;
      const protocol = getTagDerivationMode(account.currency, account.derivationMode) || "";
      const currencyAccount = formatDetailedAccount(account, account.freshAddress, state, to);

      if (asset.type === "TokenCurrency" && tuple.subAccount) {
        return [formatDetailedAccount(tuple.subAccount, account.freshAddress, state, to)];
      } else {
        return [{ ...currencyAccount, protocol }];
      }
    });

    return sortAccountsByBalance(formattedAccounts);
  }, [accounts, state, to, asset]);

  const openAddAccountFlow = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", currency ? { currency } : undefined));
      if (currency) {
        setDrawer();
      }
    },
    [dispatch],
  );

  const onAddAccountClick = () => {
    track("button_clicked", {
      button: "Add a new account",
      page: "Modular Account Selection",
      flow,
    });
    openAddAccountFlow(asset);
  };

  return { detailedAccounts, accounts, onAddAccountClick };
};
