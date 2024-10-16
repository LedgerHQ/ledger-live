import { ScreenName } from "~/const";

export type WalletConnectLiveAppNavigatorParamList = {
  [ScreenName.WalletConnectConnect]: {
    uri?: string;
    requestId?: string;
    sessionTopic?: string;
  };
};
