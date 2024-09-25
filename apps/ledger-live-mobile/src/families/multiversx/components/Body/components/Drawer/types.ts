import type {
  MultiversXAccount,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import type BigNumber from "bignumber.js";

export interface DrawerPropsType {
  onClose: () => void;
  account: MultiversXAccount;
  data: {
    type: string;
    amount: BigNumber;
    validator: MultiversXProvider;
    claimableRewards?: string | BigNumber;
    seconds?: number;
  };
}

export interface DrawerStatusType {
  [index: string]: string;
  delegation: string;
  undelegation: string;
}
