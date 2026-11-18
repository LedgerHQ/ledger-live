import { getStateFromPath } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { linkingOptions } from "../DeeplinksProvider";

describe("linkingOptions", () => {
  it("should open the Ledger Sync deeplink handler registered in the base navigator", () => {
    const config = linkingOptions().config as Parameters<typeof getStateFromPath>[1];

    const state = getStateFromPath("ledgersync", config);

    const baseRoute = state?.routes[0];
    expect(baseRoute?.name).toBe(NavigatorName.Base);
    expect(baseRoute?.state?.routes.at(-1)?.name).toBe(ScreenName.LedgerSyncDeepLinkHandler);
  });
});
