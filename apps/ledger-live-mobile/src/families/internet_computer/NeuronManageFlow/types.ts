import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

// Reserved for LIVE-29098 (neuron management flow). LIVE-29097 only registers the entry screen so
// the account "Manage Neurons" action has a navigation target; LIVE-29098 extends this param list.
export type InternetComputerNeuronManageFlowParamList = {
  [ScreenName.InternetComputerNeuronList]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
