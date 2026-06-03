import type { OperationParamsWithValAddress, StakingProtocol } from "./types";

const celoProtocol: StakingProtocol<OperationParamsWithValAddress> = {
  delegate: ({ valAddress, amount }) => [valAddress, amount],
  undelegate: ({ valAddress, amount }) => [valAddress, amount],
  redelegate: () => {
    throw new Error("Celo does not support redelegate");
  },
  getStakedBalance: ({ valAddress }) => [valAddress],
  getUnstakedBalance: ({ valAddress }) => [valAddress],
};

export default celoProtocol;
