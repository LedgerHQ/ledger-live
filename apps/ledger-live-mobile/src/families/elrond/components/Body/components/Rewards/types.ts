import type { MultiversxAccount } from "@ledgerhq/live-common/families/Multiversx/types";
import type { DelegationType } from "../../../../types";

export interface RewardsPropsType {
  account: MultiversxAccount;
  delegations: DelegationType[];
}
