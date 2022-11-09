import { ScreenName } from "../../../const";

export type WalletConnectLiveAppNavigatorParamList = {
  [ScreenName.WalletConnectScan]: {
    accountId: string;
    uri?: string;
  };
  [ScreenName.WalletConnectDeeplinkingSelectAccount]: {
    accountId?: string;
    uri?: string;
  };
  [ScreenName.WalletConnectConnect]: {
    accountId: string;
    uri?: string;
  };
};
