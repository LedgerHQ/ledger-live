import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

interface PickMethodPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      transaction?: Transaction;
      account: ElrondAccount;
      recipient: string;
      value: string;
      name: string;
    };
  };
}

export type { PickMethodPropsType };
