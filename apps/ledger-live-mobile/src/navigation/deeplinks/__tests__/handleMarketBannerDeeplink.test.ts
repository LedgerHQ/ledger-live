import { NavigatorName, ScreenName } from "~/const";
import { handleMarketBannerDeeplink } from "../handleMarketBannerDeeplink";

describe("handleMarketBannerDeeplink", () => {
  it("should return navigation state targeting MarketList via BaseNavigator", () => {
    const result = handleMarketBannerDeeplink();

    expect(result).toEqual({
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            index: 1,
            routes: [{ name: NavigatorName.Main }, { name: ScreenName.MarketList }],
          },
        },
      ],
    });
  });

  it("should have Main at index 0 so back press returns to Main instead of exiting the app", () => {
    const result = handleMarketBannerDeeplink();

    const baseState = result?.routes[0].state;
    expect(baseState?.index).toBe(1);
    expect(baseState?.routes[0]).toEqual({ name: NavigatorName.Main });
  });
});
