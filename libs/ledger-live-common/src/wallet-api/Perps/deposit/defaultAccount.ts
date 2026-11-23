import BigNumber from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";

const PREFERRED_STABLECOIN_TICKERS: ReadonlySet<string> = new Set(["USDC", "USDT"]);

export function isPreferredDepositStablecoin(currency: CryptoOrTokenCurrency): boolean {
  return PREFERRED_STABLECOIN_TICKERS.has(currency.ticker.toUpperCase());
}

type Candidate = Readonly<{ account: AccountLike; value: BigNumber | undefined }>;

function pickHighest(candidates: Candidate[]): AccountLike | undefined {
  let best: Candidate | undefined;
  for (const candidate of candidates) {
    const beatsBest =
      !best ||
      (candidate.value !== undefined &&
        (best.value === undefined || candidate.value.isGreaterThan(best.value)));
    if (beatsBest) best = candidate;
  }
  return best?.account;
}

/** Largest USDC/USDT balance (in whole units), else highest fiat balance. */
export function pickDefaultDepositAccount({
  accounts,
  isEligible,
  getFiatBalance,
}: {
  accounts: AccountLike[];
  isEligible: (account: AccountLike) => boolean;
  getFiatBalance: (account: AccountLike) => BigNumber | undefined;
}): AccountLike | undefined {
  const funded = accounts.filter(
    account => account.spendableBalance.isGreaterThan(0) && isEligible(account),
  );

  const stablecoins = funded.flatMap(account => {
    const currency = getAccountCurrency(account);
    if (!isPreferredDepositStablecoin(currency)) return [];
    const magnitude = currency.units[0]?.magnitude ?? 0;
    return [{ account, value: account.spendableBalance.shiftedBy(-magnitude) }];
  });
  if (stablecoins.length > 0) return pickHighest(stablecoins);

  return pickHighest(funded.map(account => ({ account, value: getFiatBalance(account) })));
}
