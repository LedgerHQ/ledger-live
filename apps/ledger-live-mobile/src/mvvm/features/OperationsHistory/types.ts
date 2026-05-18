import { ScreenName } from "~/const";

export type OperationsHistoryNavigatorParamsList = {
  [ScreenName.OperationsList]: { currencyId?: string } | undefined;
};
