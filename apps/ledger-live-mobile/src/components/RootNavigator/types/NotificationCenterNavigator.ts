import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { ScreenName } from "../../../const";

export type NotificationCenterNavigatorParamList = {
  [ScreenName.NotificationCenterNews]: undefined;
  [ScreenName.NotificationCenterStatus]: undefined;
};

export type NotificationCenterNavigatorScreenProps<
  RouteName extends keyof NotificationCenterNavigatorParamList,
> = MaterialTopTabScreenProps<NotificationCenterNavigatorParamList, RouteName>;
