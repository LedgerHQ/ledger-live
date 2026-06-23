import type { OperationParamsMonad, StakingProtocol } from "./types";

const monadProtocol: StakingProtocol<OperationParamsMonad> = {
  delegate: ({ valId }) => [BigInt(valId)],
  claimReward: ({ valId }) => [BigInt(valId)],
  compoundReward: ({ valId }) => [BigInt(valId)],
  undelegate: ({ valId, amount, withdrawId }) => [BigInt(valId), amount, BigInt(withdrawId!)],
  // withdraw(uint64 validatorId, uint8 withdrawId) — finalizes a matured undelegation slot.
  withdraw: ({ valId, withdrawId }) => [BigInt(valId), BigInt(withdrawId!)],
};

export default monadProtocol;
