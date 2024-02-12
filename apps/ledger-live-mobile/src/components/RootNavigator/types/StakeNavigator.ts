import { ParamListBase, RouteProp } from "@react-navigation/core";
import { ScreenName } from "~/const";
import { Account } from "@ledgerhq/types-live";

export type StakeNavigatorParamList = {
  [ScreenName.Stake]: {
    currencies?: string[];
    parentRoute?: RouteProp<ParamListBase>;
    account?: Account; // NB: not serialisable
    /** Navigate to NoFunds to get more funds, even if there are funds. */
    alwaysShowNoFunds?: boolean;
    /** Entry point is either account "stake" button but user has insufficient funds (default = undefined), or "Get <ticker>" button on Earn dashboard ("get-funds"). Text differs accordingly. */
    entryPoint?: "get-funds" | undefined;
  };
};
