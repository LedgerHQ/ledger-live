import type {
  MultiversxAccount,
  MultiversxProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import type BigNumber from "bignumber.js";

export interface DrawerPropsType {
  onClose: () => void;
  account: MultiversxAccount;
  data: {
    type: string;
    amount: BigNumber;
    validator: MultiversxProvider;
    claimableRewards?: string | BigNumber;
    seconds?: number;
  };
}

export interface DrawerStatusType {
  [index: string]: string;
  delegation: string;
  undelegation: string;
}
