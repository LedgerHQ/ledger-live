import type { OperationParamsWithValId, StakingProtocol } from "./types";

const monadProtocol: StakingProtocol<OperationParamsWithValId> = {
  delegate: ({ valId }) => [BigInt(valId)],
};

export default monadProtocol;
