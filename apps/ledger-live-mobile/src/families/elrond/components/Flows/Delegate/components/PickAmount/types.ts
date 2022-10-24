import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type {
  ElrondAccount,
  Transaction,
} from "@ledgerhq/live-common/families/elrond/types";
import type { EnhancedProviderType } from "../PickValidator/types";

export interface PickAmountPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      transaction: Transaction;
      validators: EnhancedProviderType[];
      account: ElrondAccount;
    };
  };
}
