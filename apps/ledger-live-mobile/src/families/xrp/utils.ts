import type { TokenCurrency } from "@domain/entity-currency-token";
import type BigNumber from "bignumber.js";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import { heldXrpTokenIds } from "@ledgerhq/live-common/families/xrp/tokenHolding";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";

export function findHeldTokenAccount(account: Account, token: TokenCurrency) {
  if (!heldXrpTokenIds(account).has(token.id)) return undefined;

  return account.subAccounts?.find(subAccount => subAccount.token.id === token.id);
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
  });
}
