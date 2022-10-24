import type { BigNumber } from "bignumber.js";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";

export interface SummaryPropsType {
  account: ElrondAccount;
}

export interface ItemType {
  title: string;
  show: boolean;
  value: BigNumber | string;
  modal: {
    title: string;
    description: string;
  };
}
