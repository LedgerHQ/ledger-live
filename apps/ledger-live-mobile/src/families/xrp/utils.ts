import type { TokenCurrency } from "@domain/entity-currency-token";
import type BigNumber from "bignumber.js";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { heldXrpTokenIds } from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

// An IOU fee steps in billionths: 7 decimals of a percentage
const MAX_FEE_PERCENT_DECIMALS = 7;

export function findHeldTokenAccount(account: Account, token: TokenCurrency) {
  if (!heldXrpTokenIds(account).has(token.id)) return undefined;

  return account.subAccounts?.find(subAccount => subAccount.token.id === token.id);
}

export function getManageableTokenAccounts(account: Account): XrpTokenAccount[] {
  const enabledStandards: string[] = getXrpEnabledTokenStandards(account.currency.id);

  const heldIds = heldXrpTokenIds(account);

  return (account.subAccounts ?? []).filter((subAccount): subAccount is XrpTokenAccount => {
    const isHeld = heldIds.has(subAccount.token.id);
    const isStandardEnabled = enabledStandards.includes(subAccount.token.tokenType);

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
