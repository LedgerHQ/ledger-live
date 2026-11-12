import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { XrpTokenAccount, XrpTokenResources } from "@ledgerhq/live-common/families/xrp/types";
import type BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";

// An IOU amount holds 16 significant digits: every digit after them is a 0
const MAX_PLAIN_INTEGER_DIGITS = 16;

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

export const getXrpResources = (
  account: AccountLike | undefined,
): XrpTokenResources | undefined => {
  if (account?.type !== "TokenAccount") return undefined;

  return (account as XrpTokenAccount).xrpResources;
};

// "9.999999999999998e95": every significant digit of the value
function toScientificNotation(value: BigNumber, locale: string): string {
  const [mantissa, exponent] = value.toExponential().split("e");

  const numberParts = new Intl.NumberFormat(locale).formatToParts(1.1);
  const decimalSeparator = numberParts.find(part => part.type === "decimal")?.value ?? ".";

  return `${mantissa.replace(".", decimalSeparator)}e${exponent.replace("+", "")}`;
}

/**
 * A trust limit, in the token's base units, that is too long for the plain notation:
 * "1.5e20 USD" above 16 integer digits. Null for a shorter limit.
 */
export function formatLongTrustLimit(limit: BigNumber, unit: Unit, locale: string): string | null {
  const value = limit.shiftedBy(-unit.magnitude);

  if (typeof value.e !== "number" || value.e < MAX_PLAIN_INTEGER_DIGITS) return null;

  return `${toScientificNotation(value, locale)} ${unit.code}`;
}

// A fee is a share of 10^9 at most, so 7 decimals of a percentage
const MAX_FEE_PERCENT_DECIMALS = 7;

/** An issuer fee, a percentage such as "0.5", in the locale: "0.5%" or "0,5 %" */
export function formatIssuerFee(fee: string, locale: string): string {
  const format = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: MAX_FEE_PERCENT_DECIMALS,
  });

  return format.format(Number(fee) / 100);
}
