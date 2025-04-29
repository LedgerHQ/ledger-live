import { CosmosMessage, CosmosTx } from "../types";

export type GetAccountDetails = {
  account: /** @warning ⚠️⚠️  This is undocumented and based on real life requests */
  | {
        "@type": "/cosmos.auth.v1beta1.BaseAccount";
        address: string;
        pub_key: {
          "@type": string;
          key: string;
        };
        account_number: string;
        sequence: string;
      }
    /** @warning ⚠️⚠️  This is undocumented and based on real life requests */
    | {
        "@type": "/ethermint.types.v1.EthAccount" | "/injective.types.v1beta1.EthAccount";
        base_account: {
          address: string;
          pub_key: {
            "@type": string;
            key: string;
          };
          account_number: string;
          sequence: string;
        };
        code_hash: string;
      };
};

type BlockID = {
  hash: string;
  part_set_header: {
    total: number;
    hash: string;
  };
};

type BlockVote = {
  type:
    | "SIGNED_MSG_TYPE_UNKNOWN"
    | "SIGNED_MSG_TYPE_PREVOTE"
    | "SIGNED_MSG_TYPE_PRECOMMIT"
    | "SIGNED_MSG_TYPE_PROPOSAL";
  height: string;
  round: number;
  block_id: BlockID;
  timestamp: string;
  validator_address: string;
  validator_index: number;
  signature: string;
  extension: string;
  extension_signature: string;
};

type Version = {
  block: string;
  app: string;
};

type Block = {
  header: {
    version: Version;
    chain_id: string;
    height: string;
    time: string;
    last_block_id: BlockID;
    last_commit_hash: string;
    data_hash: string;
    validators_hash: string;
    next_validators_hash: string;
    consensus_hash: string;
    app_hash: string;
    last_results_hash: string;
    evidence_hash: string;
    proposer_addres: string;
  };
  data: {
    txs: string[];
  };
  evidence: {
    evidence: {
      duplicate_vote_evidence: {
        vote_a: BlockVote;
        vote_b: BlockVote;
        total_voting_power: string;
        validator_power: string;
        timestamp: string;
      };
      light_client_attack_evidence: {
        conflicting_block: {
          signed_header: {
            header: {
              version: Version;
              chain_id: string;
              height: string;
              time: string;
              last_block_id: BlockID;
              last_commit_hash: string;
              data_hash: string;
              validators_hash: string;
              next_validators_hash: string;
              consensus_hash: string;
              app_hash: string;
              last_results_hash: string;
              evidence_hash: string;
              proposer_address: string;
            };
            commit: {
              height: string;
              round: number;
              block_id: BlockID;
              signatures: {
                block_id_flag: string;
                validator_address: string;
                timestamp: string;
                signature: string;
              };
            };
          };
        };
        common_height: string;
        byzantine_validators: {
          address: string;
          pub_key: {
            ed25519: string;
            secp256k1: string;
          };
          voting_power: string;
          proposer_priority: string;
        }[];
        total_voting_power: string;
        timestamp: string;
      };
    }[];
  };
  last_commit: {
    height: string;
    round: number;
    block_id: BlockID;
    signatures: {
      block_id_flag:
        | "BLOCK_ID_FLAG_UNKNOWN"
        | "BLOCK_ID_FLAG_ABSENT"
        | "BLOCK_ID_FLAG_COMMIT"
        | "BLOCK_ID_FLAG_NIL";
      validator_address: string;
      timestamp: string;
      signature: string;
    }[];
  };
};

export type GetNodeInfosSDK = {
  default_node_info: {
    protocol_version: {
      p2p: string;
      block: string;
      app: string;
    };
    default_node_id: string;
    listen_addr: string;
    network: string;
    version: string;
    channels: string;
    moniker: string;
    other: {
      tx_index: string;
      rpc_address: string;
    };
  };
  application_version: {
    name: string;
    app_name: string;
    version: string;
    git_commit: string;
    build_tags: string;
    go_version: string;
    build_deps: { path: string; version: string; sum: string }[];
    /** @notice (Since v0.43) */
    cosmos_sdk_version: string;
  };
};

export type GetLatestBlockSDK = {
  block_id: BlockID;
  /** @deprecated  (Deprecated: please use `sdk_block` instead) */
  block: Block;
  /** @notice (Since: cosmos-sdk 0.47) */
  sdk_block?: Block;
};

export type Balance = { denom: string; amount: string };

export type GetAllBalancesSDK = {
  balances: Balance[];
  pagination: {
    next_key: string;
    total: string;
  };
};

export type GetDelegatorDelegations = {
  delegation_responses: {
    delegation: {
      delegator_address: string;
      validator_address: string;
      shares: string;
    };
    balance: Balance;
  }[];
  pagination: {
    next_key: string;
    total: string;
  };
};

export type GetValidatorSDK = {
  validator: {
    operator_address: string;
    consensus_pubkey: {
      "@type": string;
      value: string;
    };
    jailed: boolean;
    status:
      | "BOND_STATUS_UNSPECIFIED"
      | "BOND_STATUS_UNBONDED"
      | "BOND_STATUS_UNBONDING"
      | "BOND_STATUS_BONDED";
    tokens: string;
    delegator_shares: string;
    description: {
      moniker: string;
      identity: string;
      website: string;
      security_contact: string;
      details: string;
    };
    unbonding_height: string;
    unbonding_time: string;
    commission: {
      commission_rates: {
        rate: string;
        max_rate: string;
        max_change_rate: string;
      };
      update_time: string;
    };
    min_self_delegation?: string; // Since: cosmos-sdk 0.46
    unbonding_on_hold_ref_count: string;
    unbonding_ids: string[];
  };
};

export type GetDelegationTotalReward = {
  rewards: { validator_address: string; reward: Balance[] }[];
  total: Balance[];
};

export type GetRedelegations = {
  redelegation_responses: {
    redelegation: {
      delegator_address: string;
      validator_src_address: string;
      validator_dst_address: string;
      entries:
        | {
            creation_height: string;
            completion_time: string;
            initial_balance: string;
            shares_dst: string;
          }[]
        // null since sdk 0.46
        | null;
    };
    entries: {
      redelegation_entry: {
        creation_height: string;
        completion_time: string;
        initial_balance: string;
        shares_dst: string;
        // only since sdk 0.46
        unbonding_id?: string;
      };
      balance: string;
    }[];
  }[];
  pagination: {
    next_key: string;
    total: string;
  };
};

export type GetValidatorUnbondingDelegations = {
  unbonding_responses: {
    delegator_address: string;
    validator_address: string;
    entries: {
      creation_height: string;
      completion_time: string;
      initial_balance: string;
      balance: string;
      unbonding_id: string;
      unbonding_on_hold_ref_count: string;
    }[];
  }[];
  pagination: {
    next_key: string;
    total: string;
  };
};

export type GetDelegatorWithdrawAddress = { withdraw_address: string };

export type GetTxsEvents =
  /** @deprecated (Deprecated post cosmos-sdk v0.47) */
  | {
      tx_responses: CosmosTx[];
      pagination: { total: number; next_key: string | undefined };
    }
  /** @notice (Since: cosmos-sdk v0.47) */
  | {
      tx_responses: CosmosTx[];
      total: number;
      pagination?: null;
    };

export type PostBroadcast = {
  tx_response: CosmosTx;
};

export type PostSimulate = {
  gas_info: { gas_wanted: string; gas_used: string };
  result: {
    data: string;
    log: string;
    events: CosmosMessage[];
    msg_responses: { "@type": string; value: string }[];
  };
};

export type GetValidatorItem = {
  operator_address: string;
  description: { moniker: string };
  tokens: string;
  commission: { commission_rates: { rate: string } };
};
