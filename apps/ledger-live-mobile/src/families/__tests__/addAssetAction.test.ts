import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import algorandAddAsset from "../algorand/AddAssetAction";
import stellarAddAsset from "../stellar/AddAssetAction";

const navigationMock = () => {
  const navigate = jest.fn();
  return {
    navigate,
    navigation: { navigate } as unknown as NativeStackNavigationProp<ParamListBase>,
  };
};

describe("add asset actions", () => {
  it("starts the Algorand opt-in flow on its token selection", () => {
    const { navigate, navigation } = navigationMock();

    algorandAddAsset(navigation, "account-1");

    expect(navigate).toHaveBeenCalledWith(NavigatorName.AlgorandOptInFlow, {
      screen: ScreenName.AlgorandOptInSelectToken,
      params: { accountId: "account-1" },
    });
  });

  it("starts the Stellar add asset flow on its asset selection", () => {
    const { navigate, navigation } = navigationMock();

    stellarAddAsset(navigation, "account-2");

    expect(navigate).toHaveBeenCalledWith(NavigatorName.StellarAddAssetFlow, {
      screen: ScreenName.StellarAddAssetSelectAsset,
      params: { accountId: "account-2" },
    });
  });
});
