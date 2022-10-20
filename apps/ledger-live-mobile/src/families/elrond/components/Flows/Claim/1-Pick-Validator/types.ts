import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType, ValidatorType } from "../../../../types";

interface PickValidatorPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      delegations: DelegationType[];
      account: ElrondAccount;
    };
  };
}

interface onSelectType {
  validator: ValidatorType | undefined;
  value: string;
  return: void;
}

export type { PickValidatorPropsType, onSelectType };
