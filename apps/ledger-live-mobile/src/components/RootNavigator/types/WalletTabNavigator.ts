import { NavigatorScreenParams } from "@react-navigation/native";
import { ScreenName, NavigatorName } from "~/const";
import { MarketNavigatorStackParamList } from "./MarketNavigator";

export type WalletTabNavigatorStackParamList = {
  [ScreenName.Portfolio]: undefined;
  [ScreenName.WalletNftGallery]: undefined;
  [NavigatorName.Market]: NavigatorScreenParams<MarketNavigatorStackParamList> | undefined;
};
