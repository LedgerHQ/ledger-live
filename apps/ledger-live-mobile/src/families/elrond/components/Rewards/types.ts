import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../types";

import BigNumber from "bignumber.js";

interface RewardsPropsType {
  account: ElrondAccount;
  delegations: DelegationType[];
  value: BigNumber;
}

export type { RewardsPropsType };
