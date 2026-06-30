export type StakingMessageType = {
  aminoType: string;
  protoTypeUrl: string;
};

export type StakingMessages = {
  delegate: StakingMessageType;
  undelegate: StakingMessageType;
  beginRedelegate: StakingMessageType;
  // babylon x/epoching nests each staking msg in a wrapper (amino: under `msg`; proto: MsgWrapped*)
  wrapped: boolean;
};

export const COSMOS_STAKING_MESSAGES: StakingMessages = {
  delegate: {
    aminoType: "cosmos-sdk/MsgDelegate",
    protoTypeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
  },
  undelegate: {
    aminoType: "cosmos-sdk/MsgUndelegate",
    protoTypeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
  },
  beginRedelegate: {
    aminoType: "cosmos-sdk/MsgBeginRedelegate",
    protoTypeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
  },
  wrapped: false,
};

abstract class cosmosBase {
  abstract lcd: string;
  abstract stakingDocUrl: string;
  abstract unbondingPeriod: number;
  abstract ledgerValidator: string | undefined;
  abstract validatorPrefix: string;
  abstract prefix: string;
  defaultPubKeyType = "/cosmos.crypto.secp256k1.PubKey";
  defaultGas = 100000;
  minGasPrice = 0.0025;
  version = "v1beta1";
  // chain queues staking msgs until epoch end (x/epoching); sync merges the queue into positions
  epochedStaking = false;
  stakingMessages: StakingMessages = COSMOS_STAKING_MESSAGES;
  public static COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES: string[] = [];
}

export default cosmosBase;
