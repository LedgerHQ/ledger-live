import { NavigatorName, ScreenName } from "~/const";
import type { TopBarNavigationParams } from "./types";

export const ICON_SIZE = 24;

export const expectedNavigationParams: TopBarNavigationParams = {
  myLedger: {
    name: NavigatorName.MyLedger,
    params: {
      screen: ScreenName.MyLedgerChooseDevice,
      params: { tab: undefined, searchQuery: undefined, updateModalOpened: undefined },
    },
  },
  discover: {
    name: NavigatorName.Discover,
    params: { screen: ScreenName.DiscoverScreen },
  },
  notifications: {
    name: NavigatorName.NotificationCenter,
    params: { screen: ScreenName.NotificationCenter },
  },
  settings: {
    name: NavigatorName.Settings,
  },
};
