import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { ScreenName } from "~/const";

export type ImportAccountsNavigatorParamList = {
  [ScreenName.ScanAccounts]: { data?: string[]; onFinish?: () => void } | undefined;
  [ScreenName.DisplayResult]: {
    result: ImportAccountsResult;
    onFinish?: () => void;
  };
};
