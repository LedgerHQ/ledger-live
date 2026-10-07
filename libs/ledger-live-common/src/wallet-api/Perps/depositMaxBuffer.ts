import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "../../currencies";

/** Max-deposit fee buffer in smallest units, for native coins only. */
export function getDepositMaxBuffer(
  account: AccountLike,
  constants: Readonly<Record<string, string>> | undefined,
): BigNumber {
  if (account.type !== "Account") return new BigNumber(0);

  const constant = constants?.[account.currency.id];
  if (!constant) return new BigNumber(0);

  const buffer = parseCurrencyUnit(account.currency.units[0], constant);
  return buffer.isFinite() && buffer.gt(0) ? buffer : new BigNumber(0);
}
