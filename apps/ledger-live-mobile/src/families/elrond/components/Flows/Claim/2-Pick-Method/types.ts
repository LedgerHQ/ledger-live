import { ReactNode } from "react";

import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

export interface PickMethodPropsType {
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

export interface OptionType {
  value: string;
  label: ReactNode;
}

export interface ModalType {
  title: ReactNode;
  description: ReactNode;
}
