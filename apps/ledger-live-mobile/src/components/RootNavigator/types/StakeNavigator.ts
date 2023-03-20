import { ScreenName } from "../../../const";

export type StakeNavigatorParamList = {
  [ScreenName.Stake]: {
    currencies?: string[];
  };
};
