import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type {
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import type BigNumber from "bignumber.js";

export interface PickAmountPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      amount: BigNumber;
      validator: ElrondProvider;
      account: ElrondAccount;
    };
  };
}
