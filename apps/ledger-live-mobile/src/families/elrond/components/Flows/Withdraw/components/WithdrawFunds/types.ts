import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type {
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import type BigNumber from "bignumber.js";

export interface WithdrawFundsPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      account: ElrondAccount;
      validator: ElrondProvider;
      amount: BigNumber | string;
    };
  };
}
