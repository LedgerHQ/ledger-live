import { ScreenName } from "~/const";

export type ModularDrawerNavigatorStackParamList = {
  [ScreenName.ModularDrawerDeepLinkHandler]: {
    currency?: string;
  };
};
