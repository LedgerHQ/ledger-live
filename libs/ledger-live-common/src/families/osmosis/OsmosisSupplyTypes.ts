export type OsmosisMintParams = {
  mint_denom: string;
  genesis_epoch_provisions: string;
  epoch_identifier: string;
  reduction_period_in_epochs: string;
  reduction_factor: string;
  distribution_proportions: {
    staking: string;
    pool_incentives: string;
    developer_rewards: string;
    community_pool: string;
  };
  weighted_developer_rewards_receivers: string[];
};

export type OsmosisEpochs = {
  epochs: [
    {
      identifier: string;
      start_time: string;
      duration: string;
      current_epoch: string;
      current_epoch_start_time: string;
      epoch_counting_started: boolean;
      current_epoch_ended: boolean;
    }
  ];
};

export type OsmosisEpochProvisions = {
  epoch_provisions: string;
};

export type OsmosisTotalSupply = {
  denom: string;
  amount: string;
};

export type OsmosisMintingInflation = {
  inflation: string;
};

export type OsmosisPool = {
  not_bonded_tokens: string;
  bonded_tokens: string;
};

export type OsmosisDistributionParams = {
  community_tax: string;
  base_proposer_reward: string;
  bonus_proposer_reward: string;
  withdraw_addr_enabled: boolean;
};
