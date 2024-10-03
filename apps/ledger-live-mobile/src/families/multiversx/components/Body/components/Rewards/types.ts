import type { MultiversXAccount } from "@ledgerhq/live-common/families/MultiversX/types";
import type { DelegationType } from "../../../../types";

export interface RewardsPropsType {
  account: MultiversXAccount;
  delegations: DelegationType[];
}
