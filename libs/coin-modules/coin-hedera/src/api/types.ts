export interface HederaMirrorAccount {
  account: string;
  max_automatic_token_associations: number;
  staked_node_id: number | null;
  pending_reward: number;
  balance: {
    balance: number;
    timestamp: string;
    tokens: {
      token_id: string;
      balance: number;
    }[];
  };
}

// FIXME: remove what is not needed, adjust types
export interface HederaMirrorNode {
  decline_reward: boolean;
  description: string;
  file_id: string;
  max_stake: number;
  memo: string;
  min_stake: number;
  node_account_id: string;
  node_cert_hash: string;
  node_id: number;
  public_key: string;
  reward_rate_start: number;
  stake: number;
  stake_not_rewarded: number;
  stake_rewarded: number;
  staking_period: {
    from: string;
    to: string;
  };
  timestamp: {
    from: string;
    to: string | null;
  };
}
