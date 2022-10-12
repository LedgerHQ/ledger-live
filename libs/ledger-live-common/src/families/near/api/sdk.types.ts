import * as nearAPI from "near-api-js";

import type { BigNumber } from "bignumber.js";

export type NearAccountDetails = {
  amount: string;
  storage_usage: number;
  block_height: number;
};

export type NearTransaction = {
  sender: string;
  receiver: string;
  hash: string;
  fee: string;
  success: boolean;
  height: number;
  block_hash: string;
  time: string;
  actions: [
    {
      data: {
        deposit: string;
        method_name: string;
      };
    }
  ];
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
  rewards: BigNumber;
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
