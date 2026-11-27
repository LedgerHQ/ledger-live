import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { heldXrpTokenIds } from "@ledgerhq/live-common/families/xrp/tokens";
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
    screen: ScreenName.XrpAddTokenReview,
    params: { accountId, token },
  });
}
