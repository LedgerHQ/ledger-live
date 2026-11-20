import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import {
  enabledXrpTokenStandards,
  hasPendingXrpTokenRemoval,
  heldXrpTokenIds,
  standardOf,
} from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { getSeparators } from "@ledgerhq/live-currency-format";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

// The XRPL owner reserve per held token, in drops: https://xrpl.org/docs/concepts/accounts/reserves
export const OWNER_RESERVE = new BigNumber(200_000);

// An IOU fee steps in billionths: 7 decimals of a percentage
const MAX_FEE_PERCENT_DECIMALS = 7;

export type DeleteBlocker = "pending" | "frozen";

export function findHeldTokenAccount(account: Account, token: TokenCurrency) {
  if (!heldXrpTokenIds(account).has(token.id)) return undefined;

  return account.subAccounts?.find(subAccount => subAccount.token.id === token.id);
}

export function getManageableTokenAccounts(account: Account): XrpTokenAccount[] {
  const standards = enabledXrpTokenStandards(account.currency.id);

  const heldIds = heldXrpTokenIds(account);

  return (account.subAccounts ?? []).filter((subAccount): subAccount is XrpTokenAccount => {
    const isHeld = heldIds.has(subAccount.token.id);
    const isStandardEnabled = !!standardOf(standards, subAccount.token);

    return isHeld && isStandardEnabled;
  });
}

export function applyTrustLineEdit(
  account: Account,
  tokenAccountId: string,
  edit: Readonly<{ limit: BigNumber; isRippling: boolean }>,
): Account {
  const subAccounts = account.subAccounts?.map(subAccount => {
    const { xrpResources } = subAccount as XrpTokenAccount;
    if (subAccount.id !== tokenAccountId || !xrpResources) return subAccount;

    return { ...subAccount, xrpResources: { ...xrpResources, ...edit } };
  });

  return { ...account, subAccounts };
}

function getNumberSeparators(locale: string) {
  const { thousands, decimal } = getSeparators(locale);

  return { group: thousands ?? ",", decimal: decimal ?? "." };
}

// Text pasted whole has no keystroke to tell a decimal point from a group: one separator before 1 or 2 digits is a decimal point
const PASTED_DECIMAL = /^([^.,]*)[.,](\d{1,2})$/;

// A "." or "," typed last is the decimal point: the keyboard follows the phone region, not the app language
export function formatLimitText(
  text: string,
  locale: string,
  magnitude: number,
  isPasted = false,
): string {
  const { group, decimal } = getNumberSeparators(locale);

  const spacelessText = text.replace(/\s/g, "");
  const pastedDecimal = isPasted && magnitude > 0 ? PASTED_DECIMAL.exec(spacelessText) : null;
  const compactText = pastedDecimal
    ? `${pastedDecimal[1]}${decimal}${pastedDecimal[2]}`
    : spacelessText;
  const isPointTypedLast = /[.,]$/.test(compactText);
  const numberText = isPointTypedLast ? compactText.slice(0, -1) : compactText;

  const plainNumber = numberText
    .replaceAll(group, "")
    .replaceAll(decimal, ".")
    .replace(/[^\d.]/g, "");
  const [integer = "", fraction = ""] = plainNumber.split(".");
  const hasPoint = magnitude > 0 && (isPointTypedLast || plainNumber.includes("."));

  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group);

  return hasPoint ? `${groupedInteger}${decimal}${fraction.slice(0, magnitude)}` : groupedInteger;
}

// The field shows the ticker after the number: what is typed beside or into it is not a digit
export function readLimitInput(text: string, limitText: string, ticker: string): string {
  const suffix = ` ${ticker}`;
  if (limitText === "" || text.includes(suffix)) return text.replace(suffix, "");

  const display = `${limitText}${suffix}`;

  return text === display.slice(0, -1) ? limitText.slice(0, -1) : text;
}

export function parseLimitText(unit: Unit, text: string, locale: string): BigNumber {
  const { group, decimal } = getNumberSeparators(locale);
  const plainText = text.replace(/\s/g, "").replaceAll(group, "").replace(decimal, ".");

  return parseCurrencyUnit(unit, plainText);
}

export function formatIssuerFee(fee: string, locale: string): string {
  const format = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: MAX_FEE_PERCENT_DECIMALS,
  });

  return format.format(Number(fee) / 100);
}

export function navigateToAddToken(
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
  token?: TokenCurrency,
) {
  if (!token) {
    navigation.navigate(NavigatorName.XrpAddTokenFlow, {
      screen: ScreenName.XrpAddTokenSelectToken,
      params: { accountId },
    });
    return;
  }

  navigation.navigate(NavigatorName.XrpAddTokenFlow, {
    screen: getTokenFirstScreen(token),
    params: { accountId, token },
  });
}

export function getTokenFirstScreen(token: TokenCurrency) {
  return token.tokenType === "iou" ? ScreenName.XrpAddTokenSettings : ScreenName.XrpAddTokenReview;
}

function toAssetFields(token: TokenCurrency) {
  const asset = getAssetFromToken(token);
  if (!asset || !("assetReference" in asset)) return {};

  return { assetReference: asset.assetReference, assetOwner: asset.assetOwner };
}

export function makeChangeTrustTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  token: TokenCurrency,
  amount: BigNumber,
  noRipple: boolean,
): Transaction {
  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "changeTrust",
    ...toAssetFields(token),
    amount,
    noRipple,
  });
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

export function getDeleteBlocker(
  account: Account,
  tokenAccount: XrpTokenAccount,
): DeleteBlocker | undefined {
  if (hasPendingXrpTokenRemoval(account, tokenAccount.token)) return "pending";
  if (tokenAccount.xrpResources?.isLocked) return "frozen";

  return undefined;
}
