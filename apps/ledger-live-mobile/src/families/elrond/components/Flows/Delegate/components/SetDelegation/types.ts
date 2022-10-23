import type {
  ElrondAccount,
  ElrondProvider,
  Transaction,
} from "@ledgerhq/live-common/families/elrond/types";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { DelegationType } from "../../../../../types";

export interface SetDelegationPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      accountId: string;
      delegations: DelegationType[];
      validators: ElrondProvider[];
      account: ElrondAccount;
      transaction: Transaction;
    };
  };
}
