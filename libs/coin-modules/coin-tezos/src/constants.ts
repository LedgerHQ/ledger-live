import type { APIStakingType } from "./network/types";

export const STAKING_ACTION_TO_OP_TYPE = {
  stake: "STAKE",
  unstake: "UNSTAKE",
  finalize: "FINALIZE_UNSTAKE",
} as const satisfies Record<APIStakingType["action"], string>;

export const TEZOS_DUMMY_ADDRESS = "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6";
