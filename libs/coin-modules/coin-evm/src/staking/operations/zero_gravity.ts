import type { OperationParamsZeroGravity, StakingProtocol } from "./types";

const zeroGravityProtocol: StakingProtocol<OperationParamsZeroGravity> = {
  delegate: ({ delegator }) => [delegator],
  undelegate: ({ delegator, shares }) => [delegator, shares!],
};

export default zeroGravityProtocol;
