import { NavigatorName, ScreenName } from "~/const";
import type { TopBarNavigationParams } from "./types";

export const ICON_SIZE = 24;

export const expectedNavigationParams: TopBarNavigationParams = {
  discover: {
    name: NavigatorName.Discover,
    params: { screen: ScreenName.DiscoverScreen },
  },
  search: {
    name: NavigatorName.GlobalSearch,
    params: {
      screen: ScreenName.GlobalSearch,
      params: { source: ScreenName.Portfolio },
    },
  },
};
