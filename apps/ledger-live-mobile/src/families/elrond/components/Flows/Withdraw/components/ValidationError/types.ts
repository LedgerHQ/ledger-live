import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/families/elrond/types";

export interface ValidationErrorPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      transaction: Transaction;
      accountId: string;
      deviceId: string;
      error: Error;
    };
  };
}
