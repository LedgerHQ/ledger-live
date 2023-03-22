export type Node = {
    description: string;
    file_id: string;
    min_stake: number;
    max_stake: number;
    memo: string;
    node_account_id: string;
    node_cert_hash: string;
    node_id: number;
    public_key: string;
    reward_rate_start: number;
    service_endpoints: Array<{ ip_address_v4: string; port: number }>;
    stake: number;
    stake_not_rewarded: number;
    stake_rewarded: number;
    stake_total: number;
    staking_period: {
      from: string;
      to: string;
    };
    timestamp: {
      from: string;
      to: string | null;
    };
  };
  
  export type AccountInfo = {
    account: string; // 0.0.x
    alias: string;
    auto_renew_period: null;
    balance: {
      timestamp: string;
      balance: number;
      tokens: Array<{ token_id: string; balance: number }>;
    };
    deleted: boolean;
    ethereum_nonce: number;
    evm_address: string;
    expiry_timestamp: string | null;
    key: string | null;
    max_automatic_token_associations: number;
    memo: string;
    receiver_sig_required: boolean;
    staked_account_id: string;
    staked_node_id: number;
    stake_period_start: number;
    decline_reward: boolean;
  };