import type { ElrondAccount, ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import type BigNumber from "bignumber.js";

export interface DrawerPropsType {
  onClose: () => void;
  account: ElrondAccount;
  data: {
    type: string;
    amount: BigNumber;
    validator: ElrondProvider;
    claimableRewards?: string | BigNumber;
    seconds?: number;
  };
}

export interface DrawerStatusType {
  [index: string]: string;
  delegation: string;
  undelegation: string;
}
