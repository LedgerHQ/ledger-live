import type { APIStakingType } from "./network/types";

export const STAKING_ACTION_TO_OP_TYPE = {
  stake: "STAKE",
  unstake: "UNSTAKE",
  finalize: "FINALIZE_UNSTAKE",
} as const satisfies Record<APIStakingType["action"], string>;
