import { ScreenName } from "~/const";

export type ModularDrawerNavigatorStackParamList = {
  [ScreenName.ModularDrawerDeepLinkHandler]: {
    currency?: string;
    flow?: "add-account" | "receive";
  };
  [ScreenName.ReceiveDeepLinkHandler]: {
    currency?: string;
  };
  [ScreenName.AddAccountDeepLinkHandler]: {
    currency?: string;
  };
};
