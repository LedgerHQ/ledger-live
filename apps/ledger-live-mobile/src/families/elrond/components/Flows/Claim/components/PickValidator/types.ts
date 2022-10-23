import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type {
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../../../../types";

export interface PickValidatorPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      delegations: DelegationType[];
      account: ElrondAccount;
    };
  };
}

export interface onSelectType {
  validator: ElrondProvider | undefined;
  value: string;
  return: void;
}
