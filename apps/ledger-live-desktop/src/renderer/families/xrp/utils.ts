import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getSeparators } from "@ledgerhq/live-currency-format";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { IOU_DIGITS } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { XrpTokenAccount, XrpTokenResources } from "@ledgerhq/live-common/families/xrp/types";
import type BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

export const getXrpResources = (
  account: AccountLike | undefined,
): XrpTokenResources | undefined => {
  if (account?.type !== "TokenAccount") return undefined;

  return (account as XrpTokenAccount).xrpResources;
};

// Not Intl.NumberFormat: it reads the value as a float, which drops significant digits
function toScientificNotation(value: BigNumber, locale: string): string {
  const [mantissa, exponent] = value.toExponential().split("e");
  const { decimal } = getSeparators(locale);

  return `${mantissa.replace(".", decimal ?? ".")}e${exponent.replace("+", "")}`;
}

/**
 * A trust limit, in the token's base units, that is too long for the plain notation:
 * "1.5e20 USD" above 16 integer digits. Null for a shorter limit.
 */
export function formatLongTrustLimit(limit: BigNumber, unit: Unit, locale: string): string | null {
  const value = limit.shiftedBy(-unit.magnitude);

  // Past the significant digits of an IOU, every integer digit is a 0
  if (typeof value.e !== "number" || value.e < IOU_DIGITS) return null;

  return `${toScientificNotation(value, locale)} ${unit.code}`;
}

// An IOU fee steps in billionths: 7 decimals of a percentage
const MAX_FEE_PERCENT_DECIMALS = 7;

/** An issuer fee, a percentage such as "0.5", in the locale: "0.5%" or "0,5 %" */
export function formatIssuerFee(fee: string, locale: string): string {
  const format = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: MAX_FEE_PERCENT_DECIMALS,
  });

  return format.format(Number(fee) / 100);
}
