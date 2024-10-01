import type { Account } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export interface SummaryPropsType {
  account: Account;
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
