import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { XrpTokenAccount, XrpTokenResources } from "@ledgerhq/live-common/families/xrp/types";

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

export const getXrpResources = (
  account: AccountLike | undefined,
): XrpTokenResources | undefined => {
  if (account?.type !== "TokenAccount") return undefined;

  return (account as XrpTokenAccount).xrpResources;
};

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
