import BigNumber from "bignumber.js";

/**
 * Icon Account
 */
export type AccountType = {
  address: string;
  audit_tx_hash: string;
  balance: number; //9.998855272082496
  code_hash: string;
  contract_type: string;
  contract_updated_block: number; // 0
  created_timestamp: number; // 0
  deploy_tx_hash: string;
  is_contract: boolean;
  is_nft: boolean;
  is_prep: boolean;
  is_token: boolean;
  log_count: number;
  name: string;
  owner: string;
  status: string;
  symbol: string;
  token_standard: string;
  token_transfer_count: number;
  transaction_count: number;
  transaction_internal_count: number;
  type: string;
};

/**
 * Icon TransactionType
 */
export type IconTransactionType = {
  block_number: number;
  block_timestamp: number;
  data: string;
  from_address: string;
  hash: string;
  method: string;
  status: string; // 010
  to_address: string;
  transaction_fee: string; // 0x470de4df82000"
  transaction_type: number;
  type: number;
  value: string; //0x470de4df82000
  value_decimal: number; // 4
};

/**
 *   Icon Delegation item Type
 */
export type IconDelegationItemType = {
  address: string;
  value: string;
};

/**
 *   Icon DelegationType
 */
export type IconDelegationType = {
  delegations: IconDelegationItemType[];
  totalDelegated: BigNumber;
  votingPower: BigNumber;
};
