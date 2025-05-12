import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import {
  getBalanceHistoryWithCountervalue,
  getPortfolioCount,
} from "@ledgerhq/live-countervalues/lib-es/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib-es/derivation";

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
      accounts.map(({ account }) => {
        const { name, id, ticker, units } = account.currency;

        const balance = formatCurrencyUnit(units[0], account.balance, { showCode: true });

        const count = getPortfolioCount([account], "day");
        const { history } = getBalanceHistoryWithCountervalue(account, "day", count, state, to);
        const { countervalue } = history[history.length - 1];
        const fiatValue = formatCurrencyUnit(to.units[0], BigNumber(countervalue || 0), {
          showCode: true,
        });

        const address = `${account.seedIdentifier.slice(0, 5)}...${account.seedIdentifier.slice(-5)}`;
        const protocol = getTagDerivationMode(account.currency, account.derivationMode) || "";

        return { name, id, ticker, balance, fiatValue, protocol, address };
      }),
    [accounts, state, to],
  );
};
