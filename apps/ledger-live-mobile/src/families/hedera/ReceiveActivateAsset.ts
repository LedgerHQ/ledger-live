import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { NavigatorName, ScreenName } from "~/const";

/** Associates the token: straight to the summary when it is known, else to the token list. */
export default function receiveActivateAsset(
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
  token?: TokenCurrency,
) {
  navigation.navigate(
    NavigatorName.HederaAssociateTokenFlow,
    token
      ? { screen: ScreenName.HederaAssociateTokenSummary, params: { accountId, token } }
      : { screen: ScreenName.HederaAssociateTokenSelectToken, params: { accountId } },
  );
}
