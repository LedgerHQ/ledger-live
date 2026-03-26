import { ScreenName } from "~/const";
import { OperationsListNavigator } from "./screens/OperationsList/types";

export type OperationsHistoryNavigatorParamsList = {
  [ScreenName.OperationsList]: OperationsListNavigator[ScreenName.OperationsList];
};
