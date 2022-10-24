import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type {
  ElrondAccount,
  ElrondProvider,
  Transaction,
} from "@ledgerhq/live-common/families/elrond/types";

export interface EnhancedProviderType extends ElrondProvider {
  disabled: boolean;
}

export interface PickValidatorPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      transaction: Transaction;
      validators: EnhancedProviderType[];
      account: ElrondAccount;
    };
  };
}

export interface onSelectType {
  validator: ElrondProvider;
  return: void;
}
