import React from "react";
import { CompositeScreenProps } from "@react-navigation/native";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { ImportAccountsNavigatorParamList } from "../../components/RootNavigator/types/ImportAccountsNavigator";
import type { ClaimNftNavigatorParamList } from "../../components/RootNavigator/types/ClaimNftNavigator";

import { ScreenName } from "../../const";

export type NavigationProps = CompositeScreenProps<
  | StackNavigatorProps<
      ImportAccountsNavigatorParamList,
      ScreenName.FallBackCameraScreen
    >
  | StackNavigatorProps<
      ClaimNftNavigatorParamList,
      ScreenName.FallBackCameraScreen
    >
>;

export type RedirectionScreenProps = {
  redirectionScreen: string;
};

declare const FallBackCameraScreen: React.ComponentType<
  NavigationProps & RedirectionScreenProps
>;
export default FallBackCameraScreen;
