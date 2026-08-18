export const ICP_SEND_TXN_TYPE = 0;

// ICP Rosetta ids
export const ICP_BLK_NAME_ROSETTA = "Internet Computer";
export const ICP_NET_ID_ROSETTA = "00000000000000020101";

// Mac ICP fees
export const ICP_FEES = 1e4;

export const E8S_PER_ICP = 100_000_000;

// Max Memo value on ICP network
export const MAX_MEMO_VALUE = Number.MAX_SAFE_INTEGER;

// API limits
export const FETCH_TXNS_LIMIT = 100;

// IC gateway and mainnet system canister ids
export const ICP_NETWORK_URL = "https://ic0.app";
export const MAINNET_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const MAINNET_INDEX_CANISTER_ID = "qhbym-qaaaa-aaaaa-aaafq-cai";
// NNS governance canister — target of manage_neuron / list_neurons / claim_or_refresh update calls.
export const MAINNET_GOVERNANCE_CANISTER_ID = "rrkah-fqaaa-aaaaa-aaaaq-cai";

// Ingress expiry window for update calls (5 minutes, in milliseconds)
export const DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS = 5 * 60 * 1000;

// Time ladder (seconds). SECONDS_IN_YEAR = 365.25 days, per NNS ONE_YEAR_SECONDS
// (dfinity/ic rs/nervous_system/common/src/lib.rs:66-68).
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;
export const SECONDS_IN_DAY = SECONDS_IN_HOUR * HOURS_IN_DAY;
export const SECONDS_IN_7_DAYS = 7 * SECONDS_IN_DAY;
export const SECONDS_IN_TWO_WEEKS = 14 * SECONDS_IN_DAY;
export const SECONDS_IN_YEAR = ((4 * 365 + 1) * SECONDS_IN_DAY) / 4;
export const SECONDS_IN_HALF_YEAR = SECONDS_IN_YEAR / 2;
export const SECONDS_IN_TWO_YEARS = SECONDS_IN_YEAR * 2;
export const SECONDS_IN_FOUR_YEARS = SECONDS_IN_YEAR * 4;
export const SECONDS_IN_EIGHT_YEARS = SECONDS_IN_YEAR * 8;

// Minimum stake to create a neuron: 1 ICP (dfinity/nns-dapp neurons.constants.ts:11 MIN_NEURON_STAKE).
export const MIN_NEURON_STAKE = 100_000_000;

// Worst-case NNS maturity modulation (-10%): spawn/disburse eligibility is checked against the
// amount that would survive the worst case (dfinity/nns-dapp neurons.constants.ts:14).
export const NNS_MATURITY_MODULATION_WORST_CASE_FACTOR = 0.9;

// Dissolve-delay bounds enforced by the governance canister since NNS "Mission 70"
// (Proposal 141441, executed 2026-04-17; feature flag ENABLE_MISSION_70_VOTING_REWARDS = true):
//  - hold any delay:  min 7 days   (dfinity/ic governance.rs:206 INITIAL_NEURON_DISSOLVE_DELAY)
//  - eligible to vote: min 2 weeks (dfinity/ic network_economics.rs:282-283, MISSION_70 default)
//  - maximum:          2 years     (dfinity/ic governance.rs:301-312 MAX_DISSOLVE_DELAY_SECONDS_POST_MISSION_70)
// Pre-Mission-70 these were 6 months (vote) and 8 years (max) — the values the original spec cited.
export const NNS_MINIMUM_DISSOLVE_DELAY = SECONDS_IN_7_DAYS;
export const NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE = SECONDS_IN_TWO_WEEKS;
export const NNS_MAXIMUM_DISSOLVE_DELAY = SECONDS_IN_TWO_YEARS;

// Voting-power bonuses (dfinity/ic rs/nns/governance/src/neuron/voting_power.rs, Mission 70):
//  - dissolve-delay bonus: quadratic, up to +200% (total 3x) at NNS_MAXIMUM_DISSOLVE_DELAY.
//  - age bonus: linear, up to +25% at MAX_NEURON_AGE_FOR_AGE_BONUS (4 years).
export const MAX_DISSOLVE_DELAY_BONUS = 2;
export const MAX_AGE_BONUS = 0.25;
export const MAX_NEURON_AGE_FOR_AGE_BONUS = SECONDS_IN_FOUR_YEARS;

// Governance follow topics — id ↔ name mapping (dfinity/ic NNS Topic enum; @dfinity/nns
// governance.enums.ts). The `follow` command's candid `topic` field is this Int32 id.
export const KNOWN_TOPICS = {
  Unspecified: 0,
  NeuronManagement: 1,
  ExchangeRate: 2,
  NetworkEconomics: 3,
  Governance: 4,
  NodeAdmin: 5,
  ParticipantManagement: 6,
  SubnetManagement: 7,
  NetworkCanisterManagement: 8,
  Kyc: 9,
  NodeProviderRewards: 10,
  SnsDecentralizationSale: 11,
  IcOsVersionDeployment: 12,
  IcOsVersionElection: 13,
  SnsAndCommunityFund: 14,
  ApiBoundaryNodeManagement: 15,
  SubnetRental: 16,
  ProtocolCanisterManagement: 17,
  ServiceNervousSystemManagement: 18,
} as const;
