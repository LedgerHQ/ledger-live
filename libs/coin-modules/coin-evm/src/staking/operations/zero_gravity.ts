import type { OperationParamsZeroGravity, StakingProtocol } from "./types";

const zeroGravityProtocol: StakingProtocol<OperationParamsZeroGravity> = {
  delegate: ({ delegator }) => [delegator],
};

export default zeroGravityProtocol;
