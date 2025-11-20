import { getDrawerFlowConfigs } from "../modularDrawerFlowConfigs";
import { ScreenName, NavigatorName } from "~/const";

describe("getDrawerFlowConfigs", () => {
  it("should return modular drawer config for both add_account and receive_flow", () => {
    const result = getDrawerFlowConfigs();

    expect(result).toEqual({
      modularDrawer: {
        [NavigatorName.ModularDrawer]: {
          screens: {
            [ScreenName.AddAccountDeepLinkHandler]: "add-account",
            [ScreenName.ReceiveDeepLinkHandler]: "receive",
          },
        },
      },
    });
  });
});
