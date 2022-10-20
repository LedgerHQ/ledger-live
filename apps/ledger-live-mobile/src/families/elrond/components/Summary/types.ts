import { BigNumber } from "bignumber.js";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";

interface SummaryPropsType {
  account: ElrondAccount;
}

interface ItemType {
  title: string;
  show: boolean;
  value: BigNumber | string;
  modal: {
    title: string;
    description: string;
  };
}

export type { SummaryPropsType, ItemType };
