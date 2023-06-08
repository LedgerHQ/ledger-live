import { ParamListBase, RouteProp } from "@react-navigation/core";
import { ScreenName } from "../../../const";

export type StakeNavigatorParamList = {
  [ScreenName.Stake]: {
    currencies?: string[];
    parentRoute?: RouteProp<ParamListBase>;
  };
};
