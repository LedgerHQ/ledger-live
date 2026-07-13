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

type ApiResponseBlockParent = {
  parentHashes: string[];
};

export type ApiResponseBlockHeader = {
  version: number;
  hashMerkleRoot: string;
  acceptedIdMerkleRoot: string;
  utxoCommitment: string;
  timestamp: string; // unix time in milliseconds, as a string
  bits: number;
  nonce: string;
  daaScore: string;
  blueWork: string;
  parents: ApiResponseBlockParent[];
  blueScore: string;
  pruningPoint: string;
};

export type ApiResponseBlockVerboseData = {
  hash: string;
  difficulty: number;
  selectedParentHash: string;
  transactionIds: string[];
  blueScore: string;
  childrenHashes: string[] | null;
  mergeSetBluesHashes: string[];
  mergeSetRedsHashes: string[];
  isChainBlock: boolean;
};

// A transaction as returned inside a block by `/blocks-from-bluescore?includeTransactions=true`.
// UTXO caveat: outputs carry a resolved `scriptPublicKeyAddress` + `amount`, but inputs only
// reference a previous outpoint (no address/amount) — sender debits and fees are NOT derivable
// from this endpoint without resolving each previous outpoint separately.
export type ApiResponseBlockTxInput = {
  previousOutpoint: { transactionId: string; index: number } | null;
  signatureScript: string | null;
  sigOpCount: number | null;
};

export type ApiResponseBlockTxOutput = {
  amount: number | null;
  scriptPublicKey: { scriptPublicKey: string | null; version: number | null } | null;
  verboseData: { scriptPublicKeyType: string | null; scriptPublicKeyAddress: string | null } | null;
};

export type ApiResponseBlockTransaction = {
  inputs: ApiResponseBlockTxInput[] | null;
  outputs: ApiResponseBlockTxOutput[] | null;
  subnetworkId: string | null;
  mass: number | null;
  version: number | null;
  verboseData: {
    transactionId: string;
    hash: string | null;
    computeMass: number | null;
    blockHash: string | null;
    blockTime: number | null;
  };
};

// One element of the `/blocks-from-bluescore` response array. A single blue score can map to
// several blocks (BlockDAG) — exactly one has `verboseData.isChainBlock === true`.
export type ApiResponseBlockInfo = {
  header: ApiResponseBlockHeader;
  // Empty unless the request sets includeTransactions=true.
  transactions: ApiResponseBlockTransaction[];
  verboseData: ApiResponseBlockVerboseData;
  extra?: {
    color: string | null;
    minerAddress: string | null;
    minerInfo: string | null;
  };
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
  version: number;
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
