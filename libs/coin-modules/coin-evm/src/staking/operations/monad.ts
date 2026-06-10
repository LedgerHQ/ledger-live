import type { OperationParamsMonad, StakingProtocol } from "./types";

const monadProtocol: StakingProtocol<OperationParamsMonad> = {
  delegate: ({ valId }) => [BigInt(valId)],
  claimReward: ({ valId }) => [BigInt(valId)],
  compoundReward: ({ valId }) => [BigInt(valId)],
  undelegate: ({ valId, amount, withdrawId }) => [BigInt(valId), amount, BigInt(withdrawId!)],
};

export default monadProtocol;
