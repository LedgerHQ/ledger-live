import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../types";

export interface UnbondingsPropsType {
  account: ElrondAccount;
  delegations: DelegationType[];
  onDrawer: (props: any) => void;
}
