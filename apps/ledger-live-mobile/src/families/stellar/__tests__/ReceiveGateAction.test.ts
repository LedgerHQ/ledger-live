import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NavigatorName, ScreenName } from "~/const";
import receiveGateAction from "../ReceiveGateAction";

const navigate = jest.fn();
const navigation = { navigate } as unknown as NativeStackNavigationProp<ParamListBase>;
const account = genAccount("stellar-1", { currency: getCryptoCurrencyById("stellar") });

describe("stellar ReceiveGateAction", () => {
  it("opens the add asset selection of the account", () => {
    receiveGateAction({ navigation, account });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.StellarAddAssetFlow, {
      screen: ScreenName.StellarAddAssetSelectAsset,
      params: { accountId: account.id },
    });
  });
});
