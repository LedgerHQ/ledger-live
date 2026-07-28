import { getStateFromPath } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { handleAssetDetailDeeplink } from "~/navigation/deeplinks/handleAssetDetailDeeplink";
import { getActionFromAssetDetailDeeplinkState } from "../getActionFromAssetDetailDeeplinkState";

function createAssetDetailState(params: Parameters<typeof handleAssetDetailDeeplink>[0]) {
  const state = handleAssetDetailDeeplink(params);

  if (!state) {
    throw new Error("Expected an Asset Detail navigation state");
  }

  return state;
}

describe("getActionFromAssetDetailDeeplinkState", () => {
  it("should reset navigation for each sequential token Asset Detail deeplink", () => {
    const firstState = createAssetDetailState({
      currencyId: "ethereum/erc20/usd_tether__erc20_",
      source: "deeplink_asset",
      marketState: {
        id: "ethereum/erc20/usd_tether__erc20_",
        ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
      },
    });
    const secondState = createAssetDetailState({
      currencyId: "ethereum/erc20/usd__coin",
      source: "deeplink_asset",
      marketState: {
        id: "ethereum/erc20/usd__coin",
        ledgerIds: ["ethereum/erc20/usd__coin"],
      },
    });

    expect(getActionFromAssetDetailDeeplinkState(firstState)).toEqual({
      type: "RESET",
      payload: firstState,
    });
    expect(getActionFromAssetDetailDeeplinkState(secondState)).toEqual({
      type: "RESET",
      payload: secondState,
    });
  });

  it("should keep the default navigation action for coin Asset Detail deeplinks", () => {
    const state = createAssetDetailState({
      currencyId: "bitcoin",
      source: "deeplink_asset",
    });

    expect(getActionFromAssetDetailDeeplinkState(state)?.type).toBe("NAVIGATE");
  });

  it("should keep the default navigation action for Stake deeplinks", () => {
    const state = getStateFromPath("earn?action=stake", {
      screens: { [ScreenName.Earn]: "earn" },
    });

    if (!state) {
      throw new Error("Expected a Stake navigation state");
    }

    expect(getActionFromAssetDetailDeeplinkState(state)?.type).toBe("NAVIGATE");
  });
});
