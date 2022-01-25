import { log } from "@ledgerhq/logs";
import type { PortfolioRange, BalanceHistory } from "../types";
import type { CoreAccount } from "./types";
import { TimePeriod } from "./types";
import { libcoreAmountToBigNumber } from "./buildBigNumber";
import { promiseAllBatched } from "../promise";
import { getDates, getPortfolioRangeConfig } from "../portfolio";
import invariant from "invariant";

const getAccountBalanceHistory = async (
  coreA: CoreAccount,
  range: PortfolioRange
): Promise<BalanceHistory> => {
  const dates = getDates(range);
  const conf = getPortfolioRangeConfig(range);
  const period = TimePeriod[conf.granularityId];
  log(
    "getAccountBalanceHistory",
    "calc for range=" + range + " with " + dates.length + " datapoint"
  );
  // FIXME @gre the weird date adjustment we are doing
  const to = new Date(conf.startOf(new Date()).getTime() + conf.increment - 1);
  const fromISO = new Date(dates[0].valueOf() - conf.increment).toISOString();
  const toISO = to.toISOString();
  const rawBalances = await coreA.getBalanceHistory(fromISO, toISO, period);
  const balances = await promiseAllBatched(
    5,
    rawBalances,
    libcoreAmountToBigNumber
  );
  invariant(
    balances.length === dates.length,
    "Mismatch in sizes dates/balance"
  );
  const balanceHistory = balances.map((value, i) => ({
    date: dates[i],
    value,
  }));
  log(
    "getAccountBalanceHistory",
    "DONE. calc for range=" +
      range +
      ". " +
      balanceHistory.length +
      " datapoint. period=" +
      period +
      " range: [" +
      fromISO +
      ", " +
      toISO +
      "]"
  );
  return balanceHistory;
};

export default getAccountBalanceHistory;
