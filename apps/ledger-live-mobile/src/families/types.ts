import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";

/**
 * Opens what the new receive screen asks for when the account cannot receive yet, such as the
 * token to add.
 */
export type ReceiveGateAction = (
  args: Readonly<{
    navigation: NativeStackNavigationProp<ParamListBase>;
    account: Account;
    token?: TokenCurrency;
  }>,
) => void;
