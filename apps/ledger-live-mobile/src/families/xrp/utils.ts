import type { TokenCurrency } from "@domain/entity-currency-token";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import {
  enabledXrpTokenStandards,
  hasPendingXrpTokenRemoval,
  heldXrpTokenIds,
  standardOf,
} from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

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
