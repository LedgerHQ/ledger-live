import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { isAccount } from "@ledgerhq/coin-framework/account/helpers";
import {
  getPortfolioCount,
  getBalanceHistoryWithCountervalue,
} from "@ledgerhq/live-countervalues/portfolio";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

/**
 *
 * @param account - The account to get the balance and fiat value for
 * @param state - The current state of countervalues
 * @param toCurrency - The currency to convert to
 * @param discreet - Whether to show the balance in discreet mode
 * @param showCode - Whether to show the currency code in the formatted balance
 * @returns An object containing the balance and fiat value
 */
export const getBalanceAndFiatValue = (
  account: Account | TokenAccount,
  state: CounterValuesState,
  toCurrency: Currency,
  discreet: boolean = false,
  showCode: boolean = true,
) => {
  const isAnAccount = isAccount(account);
  const details = isAnAccount ? account.currency : account.token;
  const balance = formatCurrencyUnit(details.units[0], account.balance, {
    showCode,
    discreet,
  });

  const count = getPortfolioCount([account], "day");
  const { history, countervalueAvailable } = getBalanceHistoryWithCountervalue(
    account,
    "day",
    count,
    state,
    toCurrency,
  );

  if (!countervalueAvailable) return { balance, fiatValue: undefined };

  const { countervalue } = history[history.length - 1] ?? {};
  const fiatValue = formatCurrencyUnit(toCurrency.units[0], BigNumber(countervalue ?? 0), {
    showCode,
    discreet,
  });

  return { balance, fiatValue };
};
