import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import type { DelegationType } from "../../../../types";

export interface RewardsPropsType {
  account: MultiversXAccount;
  delegations: DelegationType[];
}
