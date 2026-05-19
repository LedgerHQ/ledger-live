import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import {
  flattenAccounts,
  getAccountCurrency,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { computeAssetPnL, computePortfolioPnL } from "@ledgerhq/wallet-pnl";
import type { AssetPnL } from "@ledgerhq/wallet-pnl";
import { accountLabel } from "./labels";
import type { AssetRow, PortfolioBreakdown, SkippedAccount, SkippedReason } from "./types";

const ZERO = new BigNumber(0);

/** Rows are sorted by `|totalPnL|` desc; accounts with no PnL land in `unsupported`. */
export function computePortfolioBreakdown(
  accounts: Account[],
  countervalues: CounterValuesState,
  fiat: FiatCurrency,
  namesById?: Map<string, string>,
): PortfolioBreakdown {
  const totals = computePortfolioPnL(accounts, countervalues, fiat);

  const rows: AssetRow[] = [];
  const unsupported: SkippedAccount[] = [];

  for (const account of flattenAccounts(accounts)) {
    const pnl = computeAssetPnL(account, countervalues, fiat);
    if (!pnl) {
      unsupported.push(toSkipped(account, namesById));
      continue;
    }
    rows.push(toAssetRow(account, pnl, namesById));
  }

  rows.sort((a, b) => b.pnl.totalPnL.abs().comparedTo(a.pnl.totalPnL.abs()));

  return { totals, rows, unsupported };
}

function toAssetRow(
  account: AccountLike,
  pnl: AssetPnL,
  namesById?: Map<string, string>,
): AssetRow {
  const currency = getAccountCurrency(account);
  return {
    id: account.id,
    ticker: currency.ticker,
    currencyId: currency.id,
    label: accountLabel(account, namesById),
    isTokenAccount: account.type === "TokenAccount",
    balance: account.balance,
    currency,
    pnl,
  };
}

function toSkipped(account: AccountLike, namesById?: Map<string, string>): SkippedAccount {
  const hasOps = account.operations.length > 0;
  const hasBalance = account.balance.gt(ZERO);
  const reason: SkippedReason = !hasOps && !hasBalance ? "empty" : "no-countervalue";
  return {
    reason,
    id: account.id,
    label: accountLabel(account, namesById),
  };
}
