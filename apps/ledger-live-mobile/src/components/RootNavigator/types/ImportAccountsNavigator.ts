import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { ScreenName } from "../../../const";

export type ImportAccountsNavigatorParamList = {
  // FIXME: data SHOULD NOT BE any[]
  [ScreenName.ScanAccounts]: { data?: any[]; onFinish?: () => void };
  [ScreenName.DisplayResult]: {
    result: ImportAccountsResult;
    onFinish?: () => void;
  };
  [ScreenName.FallBackCameraScreen]: undefined;
};
