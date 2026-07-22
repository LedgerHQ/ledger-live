import type { OperationParamsZeroGravity, StakingProtocol } from "./types";

const zeroGravityProtocol: StakingProtocol<OperationParamsZeroGravity> = {
  delegate: ({ delegator }) => [delegator],
  undelegate: ({ delegator, shares }) => {
    if (shares === undefined) throw new Error("zero_gravity undelegate requires shares");
    return [delegator, shares];
  },
};

export default zeroGravityProtocol;
