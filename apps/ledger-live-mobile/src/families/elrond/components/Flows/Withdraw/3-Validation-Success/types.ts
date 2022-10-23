import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/families/elrond/types";
import type { Operation } from "@ledgerhq/types-live";

export interface ValidationSuccessPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      transaction: Transaction;
      accountId: string;
      deviceId: string;
      result: Operation;
    };
  };
}
