export const OsmosisTransactionTypeEnum = {
  // See https://docs.figment.io/network-documentation/cosmos/enriched-apis/transaction-search
  // for help on these types.
  Send: "send",
  MultiSend: "multisend",
  Delegate: "delegate",
  BeginRedelegate: "begin_redelegate",
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
  node: any; //todo fix this type
  amount: any; //todo fix this type
  transfers: any; //todo fix this type
}

export interface OsmosisEvent {
  id: string;
  kind: typeof OsmosisTransactionTypeEnum;
  sub: OsmosisSendEventContent[];
}
