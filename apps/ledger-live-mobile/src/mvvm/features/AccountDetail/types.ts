import { ScreenName } from "~/const";

export type AccountDetailNavigatorParamsList = {
  [ScreenName.AccountDetail]: { accountId: string };
  [ScreenName.AccountDetailAdvancedLogs]: { accountId: string };
};
