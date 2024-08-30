type TonAccountStatus = "uninit" | "frozen" | "active" | "nonexist";

interface TonAccountState {
  hash: string;
  balance: string | null;
  account_status: TonAccountStatus | null;
  frozen_hash: string | null;
  code_hash: string | null;
  data_hash: string | null;
}

interface TonMessage {
  hash: string;
  source: string | null;
  destination: string | null;
  value: string | null;
  fwd_fee: string | null;
  ihr_fee: string | null;
  created_lt: string | null;
  created_at: string | null;
  opcode: string | null;
  ihr_disabled: boolean | null;
  bounce: boolean | null;
  bounced: boolean | null;
  import_fee: string | null;
  message_content: {
    hash: string;
    body: string;
    decoded:
      | {
          type: "text_comment";
          comment: string;
        }
      | {
          type: "binary_comment";
          hex_comment: string;
        }
      | null;
  } | null;
  init_state: { hash: string; body: string } | null;
}

interface BlockReference {
  workchain: number;
  shard: string;
  seqno: number;
}

interface TonBlock {
  workchain: number;
  shard: string;
  seqno: number;
  root_hash: string;
  file_hash: string;
  global_id: number;
  version: number;
  after_merge: boolean;
  before_split: boolean;
  after_split: boolean;
  want_merge: boolean;
  want_split: boolean;
  key_block: boolean;
  vert_seqno_incr: boolean;
  flags: number;
  gen_utime: string;
  start_lt: string;
  end_lt: string;
  validator_list_hash_short: number;
  gen_catchain_seqno: number;
  min_ref_mc_seqno: number;
  prev_key_block_seqno: number;
  vert_seqno: number;
  master_ref_seqno: number | null;
  rand_seed: string;
  created_by: string;
  tx_count: number | null;
  masterchain_block_ref: BlockReference | null;
  prev_blocks: BlockReference[];
}

interface TrComputePhase {
  exit_code: number;
  success: boolean;
}

interface TonDescription {
  aborted: boolean;
  compute_ph: TrComputePhase;
  credit_first: boolean;
  storage_ph?: unknown;
  credit_ph?: unknown;
  action?: unknown;
  bounce?: unknown;
  destroyed: boolean;
}

export interface TonTransaction {
  account: string;
  hash: string;
  lt: string;
  now: number;
  orig_status: TonAccountStatus;
  end_status: TonAccountStatus;
  total_fees: string;
  prev_trans_hash: string;
  prev_trans_lt: string;
  description: TonDescription;
  block_ref: {
    workchain: number;
    shard: string;
    seqno: number;
  } | null;
  in_msg: TonMessage | null;
  out_msgs: TonMessage[];
  account_state_before: TonAccountState | null;
  account_state_after: TonAccountState | null;
  mc_block_seqno: number | null;
}

export interface TonAddressBook {
  [key: string]: {
    user_friendly: string;
  };
}

export interface TonJettonTransfer {
  query_id: string;
  source: string;
  destination: string;
  amount: string;
  source_wallet: string;
  jetton_master: string;
  transaction_hash: string;
  transaction_lt: string;
  transaction_now: number;
  response_destination: string | null;
  custom_payload: string | null;
  forward_ton_amount: string | null;
  forward_payload: string | null;
}

export interface TonJettonWallet {
  address: string;
  balance: string;
  owner: string;
  jetton: string;
  last_transaction_lt: string;
  code_hash: string;
  data_hash: string;
}

export interface TonAccountInfo {
  balance: string;
  last_transaction_lt: string | null;
  last_transaction_hash: string | null;
  status: TonAccountStatus;
  seqno: number;
}

export interface TonFee {
  in_fwd_fee: number;
  storage_fee: number;
  gas_fee: number;
  fwd_fee: number;
}

export interface TonResponseMasterchainInfo {
  first: TonBlock;
  last: TonBlock;
}

export interface TonTransactionsList {
  transactions: TonTransaction[];
  address_book: TonAddressBook;
}

export interface TonResponseAccountInfo {
  balance: string;
  code: string | null;
  data: string | null;
  last_transaction_lt: string | null;
  last_transaction_hash: string | null;
  frozen_hash: string | null;
  status: TonAccountStatus;
}

export interface TonResponseWalletInfo {
  balance: string;
  wallet_type: string | null;
  seqno: number | null;
  wallet_id: number | null;
  last_transaction_lt: string | null;
  last_transaction_hash: string | null;
  status: TonAccountStatus;
}

export interface TonResponseJettonTransfer {
  jetton_transfers: TonJettonTransfer[];
}

export interface TonResponseJettonWallets {
  jetton_wallets: TonJettonWallet[];
}

export interface TonResponseEstimateFee {
  source_fees: TonFee;
  destination_fees: TonFee[];
}

export interface TonResponseMessage {
  message_hash: string;
}
