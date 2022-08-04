export const OsmosisTransactionTypeEnum = {
  // See https://docs.figment.io/network-documentation/cosmos/enriched-apis/transaction-search
  // for help on these types.
  Send: "send",
  MultiSend: "multisend",
  Delegate: "delegate",
  Redelegate: "begin_redelegate",
  Undelegate: "undelegate",
  Reward: "withdraw_delegator_reward",
};

export const OsmosisCurrency = "uosmo";

// This type describes what a Transaction looks like as returned by the indexer
export interface OsmosisAccountTransaction {
  id: string;
  hash: string;
  block_hash: string;
  height: number;
  chain_id: string;
  time: Date;
  transaction_fee: OsmosisAmount[];
  gas_wanted: number;
  gas_used: number;
  version: string;
  events: OsmosisEvent[];
  has_errors: boolean;
  memo?: string;
}
export interface OsmosisAmount {
  text: string;
  currency: string;
  numeric: string;
}

export interface CosmosAmount {
  amount: string;
  denom: string;
}

export interface OsmosisEventNestedContent {
  account: any;
  amounts: OsmosisAmount[];
}

export interface OsmosisSendEventContent {
  type: string[];
  module: string;
  sender: OsmosisEventNestedContent[];
  recipient: OsmosisEventNestedContent[];
  transfers: any[];
}
export interface OsmosisStakingEventContent {
  type: string[];
  module: string;
  node: any;
  amount: any;
  transfers: any;
}

export interface OsmosisEvent {
  id: string;
  kind: typeof OsmosisTransactionTypeEnum;
  sub: OsmosisSendEventContent[] | OsmosisStakingEventContent[];
}
