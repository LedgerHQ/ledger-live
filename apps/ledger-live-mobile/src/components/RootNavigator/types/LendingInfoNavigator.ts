import { ScreenName } from "../../../const";

export type LendingInfoNavigatorParamList = {
  [ScreenName.LendingInfo1]: {
    endCallback: () => void;
  };
  [ScreenName.LendingInfo2]: {
    endCallback: () => void;
  };
  [ScreenName.LendingInfo3]: {
    endCallback: () => void;
  };
  [ScreenName.LendingTerms]: {
    endCallback: () => void;
  };
};
