import type { TFunction } from "i18next";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getSeparators } from "@ledgerhq/live-currency-format";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { IOU_DIGITS, isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type {
  TransactionStatus,
  XrpTokenAccount,
  XrpTokenResources,
} from "@ledgerhq/live-common/families/xrp/types";
import type BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

function hasPendingRemoval(account: Account, token: TokenCurrency): boolean {
  return account.pendingOperations.some(operation => {
    const raw = operation.transactionRaw;
    if (operation.type !== "OPT_OUT" || !raw) return false;
    if (!("assetReference" in raw) || !("assetOwner" in raw)) return false;

    return raw.assetReference === token.tokenIdentifier && raw.assetOwner === token.contractAddress;
  });
}

/** The reserve a removal frees, from coin-xrp's `XrpReserveRelease` warning: "0.2 XRP" */
export function getReleasedReserve(status: TransactionStatus): string | undefined {
  const warning = status.warnings.reserve;
  if (warning?.name !== "XrpReserveRelease" || !("amount" in warning)) return undefined;

  return typeof warning.amount === "string" ? warning.amount : undefined;
}

export const getXrpResources = (
  account: AccountLike | undefined,
): XrpTokenResources | undefined => {
  if (account?.type !== "TokenAccount") return undefined;

  return (account as XrpTokenAccount).xrpResources;
};

export function getManagedTokenAccounts(account: Account): TokenAccount[] {
  return (account.subAccounts ?? []).filter(subAccount => getXrpResources(subAccount));
}

export function getRemoveAvailability(account: TokenAccount, parentAccount: Account, t: TFunction) {
  if (hasPendingRemoval(parentAccount, account.token)) {
    return { disabled: true, tooltip: t("xrp.removeToken.pending") };
  }

  const xrpResources = getXrpResources(account);
  if (xrpResources?.isLocked) {
    return { disabled: true, tooltip: t("xrp.removeToken.frozen") };
  }

  return { disabled: !xrpResources };
}

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

export function formatTrustLimit({
  limit,
  unit,
  locale,
  maximumLabel,
}: {
  limit: BigNumber;
  unit: Unit;
  locale: string;
  maximumLabel: string;
}): string {
  if (isMaxTrustLimit(limit)) return maximumLabel;

  return (
    formatLongTrustLimit(limit, unit, locale) ??
    formatCurrencyUnit(unit, limit, { locale, showCode: true })
  );
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
