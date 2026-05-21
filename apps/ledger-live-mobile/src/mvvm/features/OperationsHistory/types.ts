import { ScreenName } from "~/const";

export type OperationsHistoryNavigatorParamsList = {
  [ScreenName.OperationsList]: { accountIds?: string[] } | undefined;
};
