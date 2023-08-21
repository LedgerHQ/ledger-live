import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../../../types";

export interface RewardsPropsType {
  account: ElrondAccount;
  delegations: DelegationType[];
}
