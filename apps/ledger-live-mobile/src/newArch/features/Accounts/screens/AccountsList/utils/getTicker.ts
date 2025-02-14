import { Account, TokenAccount } from "@ledgerhq/types-live";
import { isTokenAccount as isTokenAccountChecker } from "@ledgerhq/live-common/account/index";

export function getTicker(specificAccount: Account | TokenAccount) {
  const isTokenAccount = isTokenAccountChecker(specificAccount);
  if (isTokenAccount) return specificAccount.token.ticker;
  return specificAccount.currency.ticker;
}
