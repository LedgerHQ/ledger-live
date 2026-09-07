import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import invariant from "invariant";

/** Guards the staking modals against being opened before the account has been synced. */
export function assertStakingResources(account: SolanaAccount | null | undefined) {
  invariant(account?.stakingResources, "solana: account and staking resources required");
}
