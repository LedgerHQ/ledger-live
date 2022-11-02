import { ScreenName } from "../../../const";

export type LendingInfoNavigatorParamList = {
  [ScreenName.LendingInfo1]:
    | {
        endCallback?: () => void;
      }
    | undefined;
  [ScreenName.LendingInfo2]:
    | {
        endCallback?: () => void;
      }
    | undefined;
  [ScreenName.LendingInfo3]:
    | {
        endCallback?: () => void;
      }
    | undefined;
  [ScreenName.LendingTerms]:
    | {
        endCallback?: () => void;
      }
    | undefined;
};
