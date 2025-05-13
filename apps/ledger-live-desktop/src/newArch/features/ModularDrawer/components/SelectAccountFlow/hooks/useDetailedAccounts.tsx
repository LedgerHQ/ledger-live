import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";

import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib-es/derivation";

import {
  getBalanceHistoryWithCountervalue,
  getPortfolioCount,
} from "@ledgerhq/live-countervalues/lib-es/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib-es/types";

import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

import { Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";

const formatDetailedAccount = (
  account: Account | TokenAccount,
  parentSeedIdentifier: string,
  state: CounterValuesState,
  to: Currency,
): DetailedAccount => {
  const details = account.type === "Account" ? account.currency : account.token;

  const { name, id, ticker, units } = details;

  const balance = formatCurrencyUnit(units[0], account.balance, { showCode: true });

  const count = getPortfolioCount([account], "day");
  const { history } = getBalanceHistoryWithCountervalue(account, "day", count, state, to);
  const { countervalue } = history[history.length - 1] ?? {};
  const fiatValue = formatCurrencyUnit(to.units[0], BigNumber(countervalue || 0), {
    showCode: true,
  });

  const address = `${parentSeedIdentifier.slice(0, 5)}...${parentSeedIdentifier.slice(-5)}`;

  return { name, id, ticker, balance, fiatValue, address };
};

export const useDetailedAccounts = (
  asset: CryptoOrTokenCurrency,
  accounts$?: Observable<WalletAPIAccount[]>,
) => {
  const accountIds = useGetAccountIds(accounts$);
  const nestedAccounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();

  const accounts = getAccountTuplesForCurrency(asset, nestedAccounts, false, accountIds);

  return useMemo(
    () =>
      accounts.flatMap(({ account }) => {
        const currencyAccount = formatDetailedAccount(account, account.seedIdentifier, state, to);

        const acc: DetailedAccount[] = [];

        if (account.subAccounts?.length) {
          account.subAccounts.map(subAccount => {
            const tokenAccount = formatDetailedAccount(
              subAccount,
              account.seedIdentifier,
              state,
              to,
            );

            acc.push(tokenAccount);
          });
        }

        const protocol = getTagDerivationMode(account.currency, account.derivationMode) || "";

        return [{ ...currencyAccount, protocol }, ...acc];
      }),
    [accounts, state, to],
  );
};
