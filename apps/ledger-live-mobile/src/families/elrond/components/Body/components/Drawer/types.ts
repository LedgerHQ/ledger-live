import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type BigNumber from "bignumber.js";
import type { ValidatorType } from "../../../../types";

export interface DrawerPropsType {
  onClose: () => void;
  account: ElrondAccount;
  data: {
    type: string;
    amount: string | BigNumber;
    validator: ValidatorType;
    claimableRewards?: string | BigNumber;
    seconds?: number;
  };
}

export interface DrawerStatusType {
  [index: string]: string;
  delegation: string;
  undelegation: string;
}
