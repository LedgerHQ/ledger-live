import type { OperationParamsWithValAddress, StakingProtocol } from "./types";

const somniaProtocol: StakingProtocol<OperationParamsWithValAddress> = {
  delegate: ({ valAddress, amount }) => [valAddress, amount],
  undelegate: ({ valAddress, amount }) => [valAddress, amount],
  getStakedBalance: ({ delegator, valAddress }) => {
    if (!delegator) {
      throw new Error("Somnia need a delegator to retrieve staked balance");
    }
    return [delegator, valAddress];
  },
  claimReward: ({ valAddress }) => [valAddress],
};

export default somniaProtocol;
