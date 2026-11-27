import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import algorandAddAsset from "../algorand/AddAssetAction";
import stellarAddAsset from "../stellar/AddAssetAction";
import xrpAddAsset from "../xrp/AddAssetAction";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

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

  it("starts the XRP add token flow on its asset selection", () => {
    const { navigate, navigation } = navigationMock();

    xrpAddAsset(navigation, "account-3");

    expect(navigate).toHaveBeenCalledWith(NavigatorName.XrpAddTokenFlow, {
      screen: ScreenName.XrpAddTokenSelectToken,
      params: { accountId: "account-3" },
    });
  });

  describe("XRP availability", () => {
    const xrpAccount = { currency: getCryptoCurrencyById("ripple_testnet") } as Account;

    it("is available when a token standard is enabled", () => {
      jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou"]);

      expect(xrpAddAsset.isAvailable(xrpAccount)).toBe(true);
    });

    it("is unavailable when every token standard is off", () => {
      jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);

      expect(xrpAddAsset.isAvailable(xrpAccount)).toBe(false);
    });
  });
});
