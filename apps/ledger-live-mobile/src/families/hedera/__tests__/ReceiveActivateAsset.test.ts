import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { NavigatorName, ScreenName } from "~/const";
import receiveActivateAsset from "../ReceiveActivateAsset";
import algorandActivateAsset from "../../algorand/ReceiveActivateAsset";
import stellarActivateAsset from "../../stellar/ReceiveActivateAsset";

function navigation() {
  const navigate = jest.fn();
  return { navigate, nav: { navigate } as unknown as NativeStackNavigationProp<ParamListBase> };
}

const token = { id: "hedera/hts/usdc_0.0.456858", type: "TokenCurrency" } as TokenCurrency;

describe("ReceiveActivateAsset", () => {
  it("hedera goes straight to the association summary of the token", () => {
    const { navigate, nav } = navigation();

    receiveActivateAsset(nav, "account-1", token);

    expect(navigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSummary,
      params: { accountId: "account-1", token },
    });
  });

  it("hedera lists the tokens when none is given", () => {
    const { navigate, nav } = navigation();

    receiveActivateAsset(nav, "account-1");

    expect(navigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSelectToken,
      params: { accountId: "account-1" },
    });
  });

  it.each([
    ["algorand", algorandActivateAsset, NavigatorName.AlgorandOptInFlow],
    ["stellar", stellarActivateAsset, NavigatorName.StellarAddAssetFlow],
  ])("%s opens its flow on the account", (_family, activate, navigator) => {
    const { navigate, nav } = navigation();

    activate(nav, "account-1");

    expect(navigate).toHaveBeenCalledWith(
      navigator,
      expect.objectContaining({ params: { accountId: "account-1" } }),
    );
  });
});
