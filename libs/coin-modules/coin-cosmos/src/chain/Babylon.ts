import CosmosBase, { StakingMessages } from "./cosmosBase";

// The amino `type` is the proto type URL, not the legacy `epoching/WrappedDelegate` codec name:
// the x/epoching MsgWrapped* protos set no `(amino.name)`, so amino-JSON falls back to the URL.
// Matches Keplr and babylon's own SDK (@babylonlabs-io/babylon-proto-ts).
export const BABYLON_STAKING_MESSAGES: StakingMessages = {
  delegate: {
    aminoType: "/babylon.epoching.v1.MsgWrappedDelegate",
    protoTypeUrl: "/babylon.epoching.v1.MsgWrappedDelegate",
  },
  undelegate: {
    aminoType: "/babylon.epoching.v1.MsgWrappedUndelegate",
    protoTypeUrl: "/babylon.epoching.v1.MsgWrappedUndelegate",
  },
  beginRedelegate: {
    aminoType: "/babylon.epoching.v1.MsgWrappedBeginRedelegate",
    protoTypeUrl: "/babylon.epoching.v1.MsgWrappedBeginRedelegate",
  },
  wrapped: true,
};

export default class Babylon extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  epochedStaking = true;
  stakingMessages = BABYLON_STAKING_MESSAGES;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 2;
    this.prefix = "bbn";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}
