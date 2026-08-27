import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

// Reserved for LIVE-29098 (create-neuron flow). LIVE-29097 only registers the entry screen so
// the account "Stake" action has a navigation target; LIVE-29098 extends this param list.
export type InternetComputerStakingFlowParamList = {
  [ScreenName.InternetComputerStakingStarted]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
