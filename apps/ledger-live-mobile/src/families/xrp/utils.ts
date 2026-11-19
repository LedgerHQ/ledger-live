import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import {
  enabledXrpTokenStandards,
  heldXrpTokenIds,
  standardOf,
} from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

// The XRPL owner reserve per held token, in drops: https://xrpl.org/docs/concepts/accounts/reserves
export const OWNER_RESERVE = new BigNumber(200_000);

// An IOU fee steps in billionths: 7 decimals of a percentage
const MAX_FEE_PERCENT_DECIMALS = 7;

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
  const sample = new Intl.NumberFormat(locale).format(1000000.1);
  const match = sample.match(/^1(\D)000\D000(\D)1$/);

  return { group: match?.[1] ?? ",", decimal: match?.[2] ?? "." };
}

export function formatLimitText(text: string, locale: string): string {
  const { group, decimal } = getNumberSeparators(locale);

  const digitsAndSeparators = text.replace(/\s/g, "").replaceAll(group, "");
  const digitsAndDots = digitsAndSeparators.replace(/[.,]/g, ".").replace(/[^\d.]/g, "");
  const [integer = "", fraction] = digitsAndDots.split(".");

  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group);

  return typeof fraction === "string" ? `${groupedInteger}${decimal}${fraction}` : groupedInteger;
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
    screen: ScreenName.XrpAddTokenReview,
    params: { accountId, token },
  });
}

export function makeChangeTrustTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  token: TokenCurrency,
  amount: BigNumber,
  noRipple: boolean,
): Transaction {
  const asset = getAssetFromToken(token);
  const assetFields =
    asset && "assetReference" in asset
      ? { assetReference: asset.assetReference, assetOwner: asset.assetOwner }
      : {};

  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "changeTrust",
    ...assetFields,
    amount,
    noRipple,
  });
}
