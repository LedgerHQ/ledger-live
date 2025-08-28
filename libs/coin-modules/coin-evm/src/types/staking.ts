export type StakingContractConfig = {
  delegate: string;
  undelegate: string;
  redelegate?: string;
  getStakedBalance: string;
  getUnstakedBalance?: string;
};
