// Payloads shaped like the answers of the Earn backend that the stake position dialog reads:
// `POST /v3/stakes` (Earn OpenAPI `StakesV3Response`), whose rows carry the rate of the position in
// `interest`. `GET /figment/solana/validators_summary` (`FigmentValidatorAPY`) is the validator list
// that the Solana coin module reads, not the dialog. Amounts are base units (lamports for SOL) as
// digit strings.

/** The network and the wallet address that a `/v3/stakes` request asks about. */
export type EarnStakeId = { network: string; address: string };

export type SolanaStakeStatus = "activated" | "activating" | "deactivating" | "deactivated";

export type EarnInterestType = "APY" | "APR" | "NRR" | "GRR";

export type SolanaStakeWire = {
  protocol_name: string;
  currency: string;
  status: SolanaStakeStatus;
  staked_balance: string;
  rewards: { currency: string; total: string }[];
  /** The rate of the position: its kind and its value, a fraction sent as a string. */
  interest: { type: EarnInterestType; value: string; currency: string };
  details: {
    type: "SolanaDetailsView";
    stake_account: string;
    validator_address: string;
    deposited_balance: string;
  };
};

export type StakesV3Response = {
  data: { type: "BatchStakeViewV1"; id: EarnStakeId; stake: SolanaStakeWire }[];
  meta: { is_stale: boolean; responded_at: string };
};

export type ValidatorsSummaryEntry = { address: string; delegator_apy: number; name: string };

export type SolanaStakeOptions = {
  stakeAccount: string;
  /** The vote account of the validator. */
  validatorAddress: string;
  validatorName: string;
  status: SolanaStakeStatus;
  balance: string;
  deposited: string;
  rewards: string;
  /** The rate of the position as a fraction: 0.0781 is 7.81%. */
  apy: number;
};

/** A `StakeViewV1Success` for one SOL stake account. */
export function buildSolanaStake(options: SolanaStakeOptions): SolanaStakeWire {
  const {
    stakeAccount,
    validatorAddress,
    validatorName,
    status,
    balance,
    deposited,
    rewards,
    apy,
  } = options;
  return {
    protocol_name: validatorName,
    currency: "solana",
    status,
    staked_balance: balance,
    rewards: [{ currency: "solana", total: rewards }],
    interest: { type: "APY", value: String(apy), currency: "solana" },
    details: {
      type: "SolanaDetailsView",
      stake_account: stakeAccount,
      validator_address: validatorAddress,
      deposited_balance: deposited,
    },
  };
}

/** A fresh answer, one `BatchStakeViewV1` per stake. */
export function buildStakesV3Response(
  views: { id: EarnStakeId; stake: SolanaStakeWire }[],
): StakesV3Response {
  return {
    data: views.map(({ id, stake }) => ({ type: "BatchStakeViewV1", id, stake })),
    meta: { is_stale: false, responded_at: new Date().toISOString() },
  };
}

/** `apy` is a fraction: 0.0781 is 7.81%. */
export function buildValidatorsSummary(
  validators: { voteAccount: string; apy: number; name: string }[],
): ValidatorsSummaryEntry[] {
  return validators.map(({ voteAccount, apy, name }) => ({
    address: voteAccount,
    delegator_apy: apy,
    name,
  }));
}
