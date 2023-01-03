import React from "react";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { ImportAccountsNavigatorParamList } from "../../components/RootNavigator/types/ImportAccountsNavigator";
import { ClaimNftNavigatorParamList } from "../../components/RootNavigator/types/ClaimNftNavigator";

import { ScreenName } from "../../const";

export type NavigationProps =
  | StackNavigatorProps<
      ImportAccountsNavigatorParamList,
      ScreenName.FallBackCameraScreen
    >
  | StackNavigatorProps<
      ClaimNftNavigatorParamList,
      ScreenName.FallBackCameraScreen
    >;

declare const FallBackCameraScreen: React.ComponentType<NavigationProps>;
export default FallBackCameraScreen;
