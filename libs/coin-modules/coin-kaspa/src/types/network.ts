import { BigNumber } from "bignumber.js";

export type ApiResponseSubmitTransaction = {
  txId: string;
};

export type ApiResponseBlockDagInfo = {
  networkName: string;
  blockCount: string;
  headerCount: string;
  tipHashes: string[];
  difficulty: number;
  pastMedianTime: string;
  virtualParentHashes: string[];
  pruningPointHash: string;
  virtualDaaScore: string;
};

export type ApiResponseAddressActive = {
  address: string;
  active: boolean;
  lastTxBlockTime: number;
};

export type ApiResponseBalance = {
  address: string;
  balance: number;
};

export type ApiResponseFeeEstimate = {
  priorityBucket: {
    feerate: number;
    estimatedSeconds: number;
  };
  normalBuckets: Array<{
    feerate: number;
    estimatedSeconds: number;
  }>;
  lowBuckets: Array<{
    feerate: number;
    estimatedSeconds: number;
  }>;
};

type Outpoint = {
  transactionId: string;
  index: number;
};

type ScriptPublicKey = {
  scriptPublicKey: string;
};

type UtxoEntry = {
  amount: BigNumber;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: string;
  isCoinbase: boolean;
};

export type ApiResponseUtxo = {
  address: string;
  outpoint: Outpoint;
  utxoEntry: UtxoEntry;
};

export type ApiResponseTransaction = {
  subnetwork_id: string;
  transaction_id: string;
  hash: string;
  mass: string;
  block_hash: string[];
  block_time: number;
  is_accepted: boolean;
  accepting_block_hash: string;
  accepting_block_blue_score: number;
  inputs: Input[] | null;
  outputs: Output[];
};

type Input = {
  transaction_id: string;
  index: number;
  previous_outpoint_hash: string;
  previous_outpoint_index: string;
  previous_outpoint_resolved: Output;
  previous_outpoint_address: string;
  previous_outpoint_amount: number;
  signature_script: string;
  sig_op_count: string;
};

type Output = {
  transaction_id: string;
  index: number;
  amount: number;
  script_public_key: string;
  script_public_key_address: string;
  script_public_key_type: string;
  accepting_block_hash: string;
};
