import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";
import type { XrpTokenStandard } from "@ledgerhq/coin-xrp/config";
import { getSeparators } from "@ledgerhq/live-currency-format";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "../../currencies";
import { getXrpEnabledTokenStandards } from "./config";
import { IOU_DIGITS, MAX_TRUST_LIMIT, isMaxTrustLimit } from "./logicPublic";
import type { Transaction, TransactionStatus, XrpTokenAccount } from "./types";

export type RemoveBlocker = "pending" | "frozen";

type TrustLineFields = Readonly<{
  token: TokenCurrency;
  limit?: BigNumber;
  noRipple?: boolean;
}>;

/** The token standards sync reads on this network: compute once, then match each token with `standardOf`. */
export function enabledXrpTokenStandards(currencyId: string): ReadonlySet<XrpTokenStandard> {
  return new Set(getXrpEnabledTokenStandards(currencyId));
}

export function standardOf(
  standards: ReadonlySet<XrpTokenStandard>,
  token: TokenCurrency,
): XrpTokenStandard | undefined {
  return [...standards].find(standard => standard === token.tokenType);
}

/** The tokens the account holds: a token account without `xrpResources` holds no trust line. */
export function heldXrpTokenIds(account: Account): ReadonlySet<string> {
  return new Set(
    (account.subAccounts ?? [])
      .filter(sub => "xrpResources" in sub && !!sub.xrpResources)
      .map(sub => sub.token.id),
  );
}

export function hasPendingXrpTokenRemoval(account: Account, token: TokenCurrency): boolean {
  return account.pendingOperations.some(operation => {
    const raw = operation.transactionRaw;
    if (operation.type !== "OPT_OUT" || !raw) return false;
    if (!("assetReference" in raw) || !("assetOwner" in raw)) return false;

    return raw.assetReference === token.tokenIdentifier && raw.assetOwner === token.contractAddress;
  });
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

export function getRemoveBlocker(
  account: Account,
  tokenAccount: XrpTokenAccount,
): RemoveBlocker | undefined {
  if (hasPendingXrpTokenRemoval(account, tokenAccount.token)) return "pending";
  if (tokenAccount.xrpResources?.isLocked) return "frozen";

  return undefined;
}

/** The tokens the account can add: held tokens are managed elsewhere. */
export function filterTokenOptions(tokens: TokenCurrency[], account: Account): TokenCurrency[] {
  const standards = enabledXrpTokenStandards(account.currency.id);
  const heldTokenIds = heldXrpTokenIds(account);

  return tokens.filter(token => {
    if (token.parentCurrencyId !== account.currency.id) return false;
    if (token.delisted) return false;
    if (!standardOf(standards, token)) return false;
    if (heldTokenIds.has(token.id)) return false;

    return token.contractAddress !== account.freshAddress;
  });
}

/** The query is trimmed and lower case. */
export function isMatchingTokenSearch(token: TokenCurrency, query: string): boolean {
  return [token.name, token.ticker, token.contractAddress].some(value => {
    return value.toLowerCase().includes(query);
  });
}

export function toAssetFields(token: TokenCurrency) {
  if (!token.tokenIdentifier) return {};

  return { assetReference: token.tokenIdentifier, assetOwner: token.contractAddress };
}

/** Without fields, the transaction waits for a token to be picked. */
export function makeChangeTrustTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  fields?: TrustLineFields,
): Transaction {
  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "changeTrust",
    ...(fields && {
      ...toAssetFields(fields.token),
      amount: fields.limit,
      noRipple: fields.noRipple,
    }),
  });
}

/** An edit resends the line's rippling state: a TrustSet without it blocks rippling */
export function toTrustLineFields(tokenAccount: XrpTokenAccount): TrustLineFields {
  const { xrpResources } = tokenAccount;

  return {
    token: tokenAccount.token,
    limit: xrpResources?.limit,
    noRipple: !xrpResources?.isRippling,
  };
}

export function makeOptOutTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  token: TokenCurrency,
): Transaction {
  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "optOut",
    ...toAssetFields(token),
    amount: new BigNumber(0),
  });
}

// An MPT authorization carries no limit
export function getDefaultTrustLimit(token: TokenCurrency): BigNumber {
  return token.tokenType === "iou" ? MAX_TRUST_LIMIT : new BigNumber(0);
}

// A 0 limit has its own error, XrpTrustLimitZero
export function isLimitBelowBalance(limit: BigNumber, balance: BigNumber): boolean {
  return limit.gt(0) && limit.lt(balance);
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

/** The XRP the account lacks, from coin-xrp's `NotEnoughSpendableBalance` error: "0.200016 XRP" */
export function getMinimumAmount(error: Error | undefined): string | undefined {
  if (error?.name !== "NotEnoughSpendableBalance" || !("minimumAmount" in error)) return undefined;

  return typeof error.minimumAmount === "string" ? error.minimumAmount : undefined;
}

/** The reserve a removal frees, from coin-xrp's `XrpReserveRelease` warning: "0.2 XRP" */
export function getReleasedReserve(status: TransactionStatus): string | undefined {
  const warning = status.warnings.reserve;
  if (warning?.name !== "XrpReserveRelease" || !("amount" in warning)) return undefined;

  return typeof warning.amount === "string" ? warning.amount : undefined;
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
