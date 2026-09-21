import { ScreenName } from "~/const";
import type { HistoryTab } from "LLM/features/OperationsHistory/constants";

export type OperationsHistoryNavigatorParamsList = {
  [ScreenName.OperationsList]: { accountIds?: string[]; historyTab?: HistoryTab } | undefined;
};
