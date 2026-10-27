import {
  MsgWrappedBeginRedelegate,
  MsgWrappedDelegate,
  MsgWrappedUndelegate,
} from "../proto/babylonEpoching";
import CosmosBase, { StakingMessages } from "./cosmosBase";

// The amino `type` is the proto type URL, not the legacy `epoching/WrappedDelegate` codec name:
// the x/epoching MsgWrapped* protos set no `(amino.name)`, so amino-JSON falls back to the URL.
// Matches Keplr and babylon's own SDK (@babylonlabs-io/babylon-proto-ts).
export const BABYLON_STAKING_MESSAGES: StakingMessages = {
  delegate: {
    aminoType: MsgWrappedDelegate.typeUrl,
    protoTypeUrl: MsgWrappedDelegate.typeUrl,
  },
  undelegate: {
    aminoType: MsgWrappedUndelegate.typeUrl,
    protoTypeUrl: MsgWrappedUndelegate.typeUrl,
  },
  beginRedelegate: {
    aminoType: MsgWrappedBeginRedelegate.typeUrl,
    protoTypeUrl: MsgWrappedBeginRedelegate.typeUrl,
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
