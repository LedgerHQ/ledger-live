import type { BigNumber } from "bignumber.js";
import * as nearAPI from "near-api-js";

export type NearAccountDetails = {
  amount: string;
  storage_usage: number;
  block_height: number;
};

export type NearV3Response<T> = {
  data: T | null;
  meta?: { next_page?: string };
};

export type NearTransaction = {
  signer_account_id: string;
  receiver_account_id: string;
  transaction_hash: string;
  block_timestamp: string;
  outcomes_agg?: {
    transaction_fee: string;
  };
  outcomes?: { status?: boolean };
  block?: {
    block_hash?: string;
    block_height?: string;
    block_timestamp?: string;
  };
  actions_agg?: {
    deposit: string;
  };
  actions?: {
    action: string;
    method: string | null;
  }[];
};

export type NearProtocolConfig = {
  runtime_config: {
    storage_amount_per_byte: string;
    transaction_costs: {
      action_creation_config: {
        add_key_cost: {
          full_access_cost: {
            execution: number;
            send_not_sir: number;
          };
        };
        create_account_cost: {
          execution: number;
          send_not_sir: number;
        };
        transfer_cost: {
          execution: number;
          send_not_sir: number;
        };
      };
      action_receipt_creation_config: {
        execution: number;
        send_not_sir: number;
      };
    };
  };
};

export type NearAccessKey = {
  nonce: number;
  block_hash: string;
};

export type NearStakingDeposit = {
  deposit: string;
  validator_id: string;
};

export type NearStakingPosition = {
  staked: BigNumber;
  available: BigNumber;
  pending: BigNumber;
  validatorId: string;
};

export type NearRawValidator = {
  account_id: string;
  stake: string;
};

export type NearContractMethod = (params: { account_id: string }) => string;

export type NearContract = nearAPI.Contract & {
  get_account_staked_balance: NearContractMethod;
  get_account_unstaked_balance: NearContractMethod;
  is_account_unstaked_balance_available: NearContractMethod;
  get_account_total_balance: NearContractMethod;
};
