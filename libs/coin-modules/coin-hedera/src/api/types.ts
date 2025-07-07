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

export interface HederaMirrorNode {
  node_id: number;
  node_account_id: string;
  description: string;
  max_stake: number;
  min_stake: number;
  stake: number;
  stake_rewarded: number;
}
