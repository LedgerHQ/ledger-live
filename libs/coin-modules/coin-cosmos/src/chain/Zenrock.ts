import CosmosBase, { StakingMessages } from "./cosmosBase";

export const ZENROCK_STAKING_MESSAGES: StakingMessages = {
  delegate: {
    aminoType: "zrchain/MsgDelegate",
    protoTypeUrl: "/zrchain.validation.MsgDelegate",
  },
  undelegate: {
    aminoType: "zrchain/MsgUndelegate",
    protoTypeUrl: "/zrchain.validation.MsgUndelegate",
  },
  beginRedelegate: {
    aminoType: "zrchain/MsgBeginRedelegate",
    protoTypeUrl: "/zrchain.validation.MsgBeginRedelegate",
  },
  wrapped: false,
};

class Zenrock extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  stakingMessages = ZENROCK_STAKING_MESSAGES;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 21;
    this.prefix = "zen";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Zenrock;
