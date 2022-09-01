import React from "react";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { ImportAccountsNavigatorParamList } from "../../components/RootNavigator/types/ImportAccountsNavigator";
import { ScreenName } from "../../const";

export type NavigationProps = StackNavigatorProps<
  ImportAccountsNavigatorParamList,
  ScreenName.FallBackCameraScreen
>;

declare const FallBackCameraScreen: React.ComponentType<NavigationProps>;
export default FallBackCameraScreen;
