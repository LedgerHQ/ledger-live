import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NavigatorName, ScreenName } from "~/const";
import receiveGateAction from "../ReceiveGateAction";

const navigate = jest.fn();
const navigation = { navigate } as unknown as NativeStackNavigationProp<ParamListBase>;
const account = genAccount("algorand-1", { currency: getCryptoCurrencyById("algorand") });

describe("algorand ReceiveGateAction", () => {
  it("opens the opt-in token selection of the account", () => {
    receiveGateAction({ navigation, account });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.AlgorandOptInFlow, {
      screen: ScreenName.AlgorandOptInSelectToken,
      params: { accountId: account.id },
    });
  });
});
