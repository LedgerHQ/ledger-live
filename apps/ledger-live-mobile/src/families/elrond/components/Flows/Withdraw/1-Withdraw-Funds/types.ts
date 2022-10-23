import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type BigNumber from "bignumber.js";
import type { ValidatorType } from "../../../../types";

export interface WithdrawFundsPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      account: ElrondAccount;
      validator: ValidatorType;
      amount: BigNumber | string;
    };
  };
}
