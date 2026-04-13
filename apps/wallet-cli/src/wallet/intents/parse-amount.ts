import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account, TokenAccount } from "@ledgerhq/types-live";

export interface ParsedAmount {
  assetId: string;
  amount: BigNumber;
}

/**
 * Parse an amount string like "0.5 ETH", "0.4 USDT", "ETH 0.5" etc.
 * Ticker is mandatory. Resolves against the account's native currency and token sub-accounts.
 */
export function parseAmountWithTicker(input: string, account: Account): ParsedAmount {
  const trimmed = input.trim();
  // Try "NUMBER TICKER" or "TICKER NUMBER" (with optional space)
  const match =
    /^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/.exec(trimmed) ||
    /^([A-Za-z]+)\s*(\d+(?:\.\d+)?)$/.exec(trimmed);

  if (!match) {
    throw new Error(`Amount must include a ticker, e.g. '0.5 ETH' or '0.001 BTC'. Got: "${input}"`);
  }

  // Determine which group is number and which is ticker
  let numStr: string;
  let ticker: string;
  if (/^\d/.test(match[1])) {
    numStr = match[1];
    ticker = match[2];
  } else {
    ticker = match[1];
    numStr = match[2];
  }

  const tickerUpper = ticker.toUpperCase();

  // Check native currency
  if (account.currency.ticker.toUpperCase() === tickerUpper) {
    const unit = account.currency.units[0];
    return { assetId: account.currency.id, amount: parseCurrencyUnit(unit, numStr) };
  }

  // Check token sub-accounts
  const tokenSubs = (account.subAccounts ?? []).filter(
    (s): s is TokenAccount => s.type === "TokenAccount",
  );
  const tokenMatch = tokenSubs.find(s => s.token.ticker.toUpperCase() === tickerUpper);
  if (tokenMatch) {
    const unit = tokenMatch.token.units[0];
    return { assetId: tokenMatch.token.id, amount: parseCurrencyUnit(unit, numStr) };
  }

  // Not found — list available
  const available = [account.currency.ticker, ...tokenSubs.map(s => s.token.ticker)].join(", ");
  throw new Error(`Ticker "${ticker}" not found in account. Available: ${available}`);
}
