import type {
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { DelegationType } from "../../../../../types";

export interface EarnRewardsPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      accountId: string;
      delegations: DelegationType[];
      validators: ElrondProvider[];
      account: ElrondAccount;
    };
  };
}
