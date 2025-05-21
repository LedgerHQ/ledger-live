import { useMemo } from "react";
import { useSelector } from "react-redux";
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

const formatAddress = (address: string) => `${address.slice(0, 5)}...${address.slice(-5)}`;

const formatDetailedAccount = (
  account: Account | TokenAccount,
  parentAddress: string,
  state: CounterValuesState,
  to: Currency,
): DetailedAccount => {
  const details = account.type === "Account" ? account.currency : account.token;

  const { id } = account;
  const { name, ticker, units, id: cryptoId } = details;

  const balance = formatCurrencyUnit(units[0], account.balance, { showCode: true });

  const count = getPortfolioCount([account], "day");
  const { history } = getBalanceHistoryWithCountervalue(account, "day", count, state, to);
  const { countervalue } = history[history.length - 1] ?? {};
  const fiatValue = formatCurrencyUnit(to.units[0], BigNumber(countervalue || 0), {
    showCode: true,
  });

  const address = formatAddress(parentAddress);

  return { name, id, ticker, balance, fiatValue, address, cryptoId };
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

  const detailedAccounts = useMemo(
    () =>
      accounts.flatMap(({ account }) => {
        const currencyAccount = formatDetailedAccount(account, account.freshAddress, state, to);

        const subAccounts = account.subAccounts?.length
          ? account.subAccounts.map(subAccount =>
              formatDetailedAccount(subAccount, account.freshAddress, state, to),
            )
          : [];

        const protocol = getTagDerivationMode(account.currency, account.derivationMode) || "";

        return [{ ...currencyAccount, protocol }, ...subAccounts];
      }),
    [accounts, state, to],
  );

  return { detailedAccounts, accounts };
};
