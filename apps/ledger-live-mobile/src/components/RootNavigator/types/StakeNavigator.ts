import { ParamListBase, RouteProp } from "@react-navigation/core";
import { ScreenName } from "../../../const";
import { Account } from "@ledgerhq/types-live";

export type StakeNavigatorParamList = {
  [ScreenName.Stake]: {
    currencies?: string[];
    parentRoute?: RouteProp<ParamListBase>;
    account?: Account; // NB: not serialisable
    alwaysShowNoFunds?: boolean; // Navigates to NoFunds to get more funds, even if there are funds
  };
};
