import { ParamListBase, RouteProp } from "@react-navigation/core";
import { ScreenName } from "../../../const";
import { Account } from "@ledgerhq/types-live";

export type StakeNavigatorParamList = {
  [ScreenName.Stake]: {
    currencies?: string[];
    parentRoute?: RouteProp<ParamListBase>;
    account?: Account;
    alwaysShowNoFunds?: boolean;
  };
};
