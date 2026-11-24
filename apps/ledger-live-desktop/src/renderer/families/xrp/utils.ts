import type { TFunction } from "i18next";
import type { Account, AccountBridge, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getSeparators } from "@ledgerhq/live-currency-format";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { IOU_DIGITS, isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import {
  enabledXrpTokenStandards,
  heldXrpTokenIds,
  standardOf,
  hasPendingXrpTokenRemoval,
} from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type {
  Transaction,
  TransactionStatus,
  XrpTokenAccount,
  XrpTokenResources,
} from "@ledgerhq/live-common/families/xrp/types";
import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";

// The XRPL owner reserve per held token, in drops: https://xrpl.org/docs/concepts/accounts/reserves
export const OWNER_RESERVE = new BigNumber(200_000);

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

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

export function toAssetFields(token: TokenCurrency) {
  const asset = getAssetFromToken(token);
  if (!asset || !("assetReference" in asset)) return {};

  return { assetReference: asset.assetReference, assetOwner: asset.assetOwner };
}

export function makeChangeTrustTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  tokenAccount: TokenAccount | undefined,
): Transaction {
  const xrpResources = getXrpResources(tokenAccount);

  // An edit resends the line's rippling state: a TrustSet without it blocks rippling
  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "changeTrust",
    ...(tokenAccount && {
      ...toAssetFields(tokenAccount.token),
      amount: xrpResources?.limit,
      noRipple: !xrpResources?.isRippling,
    }),
  });
}

export function makeOptOutTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  tokenAccount: TokenAccount,
): Transaction {
  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "optOut",
    ...toAssetFields(tokenAccount.token),
    amount: new BigNumber(0),
  });
}

const LIMIT_ERRORS = new Set([
  "XrpTrustLimitZero",
  "XrpTrustLimitTooHigh",
  "XrpAmountPrecisionExceeded",
]);

// Other amount errors, like missing XRP, show outside the limit field
export function getLimitError(status: TransactionStatus): Error | undefined {
  const amountError = status.errors.amount;

  return amountError && LIMIT_ERRORS.has(amountError.name) ? amountError : undefined;
}

export function getManagedTokenAccounts(account: Account): XrpTokenAccount[] {
  const standards = enabledXrpTokenStandards(account.currency.id);
  const heldIds = heldXrpTokenIds(account);

  return (account.subAccounts ?? []).filter((subAccount): subAccount is XrpTokenAccount => {
    const isHeld = heldIds.has(subAccount.token.id);
    const isStandardEnabled = !!standardOf(standards, subAccount.token);

    return isHeld && isStandardEnabled;
  });
}

export function getRemoveAvailability(account: TokenAccount, parentAccount: Account, t: TFunction) {
  if (hasPendingXrpTokenRemoval(parentAccount, account.token)) {
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
  discreet,
  maximumLabel,
}: {
  limit: BigNumber;
  unit: Unit;
  locale: string;
  discreet: boolean;
  maximumLabel: string;
}): string {
  if (isMaxTrustLimit(limit)) return maximumLabel;

  return (
    formatLongTrustLimit(limit, unit, locale) ??
    formatCurrencyUnit(unit, limit, { discreet, locale, showCode: true })
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
