// @ts-nocheck -- vendored generated candid; exempt from strict checks
/* eslint-disable */
// Vendored from @dfinity/nns v10.4.0 (Apache-2.0), packages/nns/candid/governance.idl.js — the NNS
// governance canister interface factory, generated from governance.did (dfinity/ic commit c211885f7c,
// 2025-10-09). Only the `idlFactory` service export is kept (the upstream `init` args factory is
// dropped) and the `IDL.InterfaceFactory` type annotation + this header are added. Do not edit by
// hand; refresh from the published package when the interface changes. Excluded from oxfmt via
// .prettierignore to preserve provenance.
import type { IDL } from "@dfinity/candid";
/* Do not edit.  Compiled with ./scripts/compile-idl-js from packages/nns/candid/governance.did */
export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const ManageNeuronRequest = IDL.Rec();
  const Proposal = IDL.Rec();
  const NeuronId = IDL.Record({ id: IDL.Nat64 });
  const Followees = IDL.Record({ followees: IDL.Vec(NeuronId) });
  const AccountIdentifier = IDL.Record({ hash: IDL.Vec(IDL.Nat8) });
  const NodeProvider = IDL.Record({
    id: IDL.Opt(IDL.Principal),
    reward_account: IDL.Opt(AccountIdentifier),
  });
  const RewardToNeuron = IDL.Record({ dissolve_delay_seconds: IDL.Nat64 });
  const RewardToAccount = IDL.Record({
    to_account: IDL.Opt(AccountIdentifier),
  });
  const RewardMode = IDL.Variant({
    RewardToNeuron: RewardToNeuron,
    RewardToAccount: RewardToAccount,
  });
  const RewardNodeProvider = IDL.Record({
    node_provider: IDL.Opt(NodeProvider),
    reward_mode: IDL.Opt(RewardMode),
    amount_e8s: IDL.Nat64,
  });
  const XdrConversionRate = IDL.Record({
    xdr_permyriad_per_icp: IDL.Opt(IDL.Nat64),
    timestamp_seconds: IDL.Opt(IDL.Nat64),
  });
  const MonthlyNodeProviderRewards = IDL.Record({
    minimum_xdr_permyriad_per_icp: IDL.Opt(IDL.Nat64),
    registry_version: IDL.Opt(IDL.Nat64),
    node_providers: IDL.Vec(NodeProvider),
    timestamp: IDL.Nat64,
    rewards: IDL.Vec(RewardNodeProvider),
    xdr_conversion_rate: IDL.Opt(XdrConversionRate),
    maximum_node_provider_rewards_e8s: IDL.Opt(IDL.Nat64),
  });
  const NeuronSubsetMetrics = IDL.Record({
    total_maturity_e8s_equivalent: IDL.Opt(IDL.Nat64),
    maturity_e8s_equivalent_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    voting_power_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    total_staked_e8s: IDL.Opt(IDL.Nat64),
    count: IDL.Opt(IDL.Nat64),
    deciding_voting_power_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    total_staked_maturity_e8s_equivalent: IDL.Opt(IDL.Nat64),
    total_potential_voting_power: IDL.Opt(IDL.Nat64),
    total_deciding_voting_power: IDL.Opt(IDL.Nat64),
    staked_maturity_e8s_equivalent_buckets: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64),
    ),
    staked_e8s_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    total_voting_power: IDL.Opt(IDL.Nat64),
    potential_voting_power_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    count_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
  });
  const GovernanceCachedMetrics = IDL.Record({
    total_maturity_e8s_equivalent: IDL.Nat64,
    not_dissolving_neurons_e8s_buckets: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    dissolving_neurons_staked_maturity_e8s_equivalent_sum: IDL.Nat64,
    garbage_collectable_neurons_count: IDL.Nat64,
    dissolving_neurons_staked_maturity_e8s_equivalent_buckets: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    neurons_with_invalid_stake_count: IDL.Nat64,
    not_dissolving_neurons_count_buckets: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Nat64),
    ),
    ect_neuron_count: IDL.Nat64,
    total_supply_icp: IDL.Nat64,
    neurons_with_less_than_6_months_dissolve_delay_count: IDL.Nat64,
    dissolved_neurons_count: IDL.Nat64,
    community_fund_total_maturity_e8s_equivalent: IDL.Nat64,
    total_staked_e8s_seed: IDL.Nat64,
    total_staked_maturity_e8s_equivalent_ect: IDL.Nat64,
    total_staked_e8s: IDL.Nat64,
    fully_lost_voting_power_neuron_subset_metrics: IDL.Opt(NeuronSubsetMetrics),
    not_dissolving_neurons_count: IDL.Nat64,
    total_locked_e8s: IDL.Nat64,
    neurons_fund_total_active_neurons: IDL.Nat64,
    total_voting_power_non_self_authenticating_controller: IDL.Opt(IDL.Nat64),
    total_staked_maturity_e8s_equivalent: IDL.Nat64,
    not_dissolving_neurons_e8s_buckets_ect: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    spawning_neurons_count: IDL.Nat64,
    declining_voting_power_neuron_subset_metrics: IDL.Opt(NeuronSubsetMetrics),
    total_staked_e8s_ect: IDL.Nat64,
    not_dissolving_neurons_staked_maturity_e8s_equivalent_sum: IDL.Nat64,
    dissolved_neurons_e8s: IDL.Nat64,
    total_staked_e8s_non_self_authenticating_controller: IDL.Opt(IDL.Nat64),
    dissolving_neurons_e8s_buckets_seed: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    neurons_with_less_than_6_months_dissolve_delay_e8s: IDL.Nat64,
    not_dissolving_neurons_staked_maturity_e8s_equivalent_buckets: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    dissolving_neurons_count_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64)),
    dissolving_neurons_e8s_buckets_ect: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    non_self_authenticating_controller_neuron_subset_metrics:
      IDL.Opt(NeuronSubsetMetrics),
    dissolving_neurons_count: IDL.Nat64,
    dissolving_neurons_e8s_buckets: IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Float64)),
    total_staked_maturity_e8s_equivalent_seed: IDL.Nat64,
    community_fund_total_staked_e8s: IDL.Nat64,
    not_dissolving_neurons_e8s_buckets_seed: IDL.Vec(
      IDL.Tuple(IDL.Nat64, IDL.Float64),
    ),
    public_neuron_subset_metrics: IDL.Opt(NeuronSubsetMetrics),
    timestamp_seconds: IDL.Nat64,
    seed_neuron_count: IDL.Nat64,
  });
  const VotingPowerEconomics = IDL.Record({
    start_reducing_voting_power_after_seconds: IDL.Opt(IDL.Nat64),
    neuron_minimum_dissolve_delay_to_vote_seconds: IDL.Opt(IDL.Nat64),
    clear_following_after_seconds: IDL.Opt(IDL.Nat64),
  });
  const Percentage = IDL.Record({ basis_points: IDL.Opt(IDL.Nat64) });
  const Decimal = IDL.Record({ human_readable: IDL.Opt(IDL.Text) });
  const NeuronsFundMatchedFundingCurveCoefficients = IDL.Record({
    contribution_threshold_xdr: IDL.Opt(Decimal),
    one_third_participation_milestone_xdr: IDL.Opt(Decimal),
    full_participation_milestone_xdr: IDL.Opt(Decimal),
  });
  const NeuronsFundEconomics = IDL.Record({
    maximum_icp_xdr_rate: IDL.Opt(Percentage),
    neurons_fund_matched_funding_curve_coefficients: IDL.Opt(
      NeuronsFundMatchedFundingCurveCoefficients,
    ),
    max_theoretical_neurons_fund_participation_amount_xdr: IDL.Opt(Decimal),
    minimum_icp_xdr_rate: IDL.Opt(Percentage),
  });
  const NetworkEconomics = IDL.Record({
    neuron_minimum_stake_e8s: IDL.Nat64,
    voting_power_economics: IDL.Opt(VotingPowerEconomics),
    max_proposals_to_keep_per_topic: IDL.Nat32,
    neuron_management_fee_per_proposal_e8s: IDL.Nat64,
    reject_cost_e8s: IDL.Nat64,
    transaction_fee_e8s: IDL.Nat64,
    neuron_spawn_dissolve_delay_seconds: IDL.Nat64,
    minimum_icp_xdr_rate: IDL.Nat64,
    maximum_node_provider_rewards_e8s: IDL.Nat64,
    neurons_fund_economics: IDL.Opt(NeuronsFundEconomics),
  });
  const RestoreAgingNeuronGroup = IDL.Record({
    count: IDL.Opt(IDL.Nat64),
    previous_total_stake_e8s: IDL.Opt(IDL.Nat64),
    current_total_stake_e8s: IDL.Opt(IDL.Nat64),
    group_type: IDL.Int32,
  });
  const RestoreAgingSummary = IDL.Record({
    groups: IDL.Vec(RestoreAgingNeuronGroup),
    timestamp_seconds: IDL.Opt(IDL.Nat64),
  });
  const ProposalId = IDL.Record({ id: IDL.Nat64 });
  const RewardEvent = IDL.Record({
    rounds_since_last_distribution: IDL.Opt(IDL.Nat64),
    day_after_genesis: IDL.Nat64,
    actual_timestamp_seconds: IDL.Nat64,
    total_available_e8s_equivalent: IDL.Nat64,
    latest_round_available_e8s_equivalent: IDL.Opt(IDL.Nat64),
    distributed_e8s_equivalent: IDL.Nat64,
    settled_proposals: IDL.Vec(ProposalId),
  });
  const NeuronStakeTransfer = IDL.Record({
    to_subaccount: IDL.Vec(IDL.Nat8),
    neuron_stake_e8s: IDL.Nat64,
    from: IDL.Opt(IDL.Principal),
    memo: IDL.Nat64,
    from_subaccount: IDL.Vec(IDL.Nat8),
    transfer_timestamp: IDL.Nat64,
    block_height: IDL.Nat64,
  });
  const GovernanceError = IDL.Record({
    error_message: IDL.Text,
    error_type: IDL.Int32,
  });
  const Ballot = IDL.Record({ vote: IDL.Int32, voting_power: IDL.Nat64 });
  const SwapParticipationLimits = IDL.Record({
    min_participant_icp_e8s: IDL.Opt(IDL.Nat64),
    max_participant_icp_e8s: IDL.Opt(IDL.Nat64),
    min_direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    max_direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
  });
  const NeuronsFundNeuronPortion = IDL.Record({
    controller: IDL.Opt(IDL.Principal),
    hotkeys: IDL.Vec(IDL.Principal),
    is_capped: IDL.Opt(IDL.Bool),
    maturity_equivalent_icp_e8s: IDL.Opt(IDL.Nat64),
    nns_neuron_id: IDL.Opt(NeuronId),
    amount_icp_e8s: IDL.Opt(IDL.Nat64),
  });
  const NeuronsFundSnapshot = IDL.Record({
    neurons_fund_neuron_portions: IDL.Vec(NeuronsFundNeuronPortion),
  });
  const IdealMatchedParticipationFunction = IDL.Record({
    serialized_representation: IDL.Opt(IDL.Text),
  });
  const NeuronsFundParticipation = IDL.Record({
    total_maturity_equivalent_icp_e8s: IDL.Opt(IDL.Nat64),
    intended_neurons_fund_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    swap_participation_limits: IDL.Opt(SwapParticipationLimits),
    max_neurons_fund_swap_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    neurons_fund_reserves: IDL.Opt(NeuronsFundSnapshot),
    ideal_matched_participation_function: IDL.Opt(
      IdealMatchedParticipationFunction,
    ),
    allocated_neurons_fund_participation_icp_e8s: IDL.Opt(IDL.Nat64),
  });
  const NeuronsFundData = IDL.Record({
    final_neurons_fund_participation: IDL.Opt(NeuronsFundParticipation),
    initial_neurons_fund_participation: IDL.Opt(NeuronsFundParticipation),
    neurons_fund_refunds: IDL.Opt(NeuronsFundSnapshot),
  });
  const CanisterStatusResultV2 = IDL.Record({
    status: IDL.Opt(IDL.Int32),
    freezing_threshold: IDL.Opt(IDL.Nat64),
    controllers: IDL.Vec(IDL.Principal),
    memory_size: IDL.Opt(IDL.Nat64),
    cycles: IDL.Opt(IDL.Nat64),
    idle_cycles_burned_per_day: IDL.Opt(IDL.Nat64),
    module_hash: IDL.Vec(IDL.Nat8),
  });
  const CanisterSummary = IDL.Record({
    status: IDL.Opt(CanisterStatusResultV2),
    canister_id: IDL.Opt(IDL.Principal),
  });
  const SwapBackgroundInformation = IDL.Record({
    ledger_index_canister_summary: IDL.Opt(CanisterSummary),
    fallback_controller_principal_ids: IDL.Vec(IDL.Principal),
    ledger_archive_canister_summaries: IDL.Vec(CanisterSummary),
    ledger_canister_summary: IDL.Opt(CanisterSummary),
    swap_canister_summary: IDL.Opt(CanisterSummary),
    governance_canister_summary: IDL.Opt(CanisterSummary),
    root_canister_summary: IDL.Opt(CanisterSummary),
    dapp_canister_summaries: IDL.Vec(CanisterSummary),
  });
  const DerivedProposalInformation = IDL.Record({
    swap_background_information: IDL.Opt(SwapBackgroundInformation),
  });
  const Tally = IDL.Record({
    no: IDL.Nat64,
    yes: IDL.Nat64,
    total: IDL.Nat64,
    timestamp_seconds: IDL.Nat64,
  });
  const TopicToFollow = IDL.Variant({
    Kyc: IDL.Null,
    ServiceNervousSystemManagement: IDL.Null,
    ApiBoundaryNodeManagement: IDL.Null,
    ApplicationCanisterManagement: IDL.Null,
    SubnetRental: IDL.Null,
    NeuronManagement: IDL.Null,
    NodeProviderRewards: IDL.Null,
    SubnetManagement: IDL.Null,
    ExchangeRate: IDL.Null,
    CatchAll: IDL.Null,
    NodeAdmin: IDL.Null,
    IcOsVersionElection: IDL.Null,
    ProtocolCanisterManagement: IDL.Null,
    NetworkEconomics: IDL.Null,
    IcOsVersionDeployment: IDL.Null,
    ParticipantManagement: IDL.Null,
    Governance: IDL.Null,
    SnsAndCommunityFund: IDL.Null,
  });
  const KnownNeuronData = IDL.Record({
    name: IDL.Text,
    committed_topics: IDL.Opt(IDL.Vec(IDL.Opt(TopicToFollow))),
    description: IDL.Opt(IDL.Text),
    links: IDL.Opt(IDL.Vec(IDL.Text)),
  });
  const KnownNeuron = IDL.Record({
    id: IDL.Opt(NeuronId),
    known_neuron_data: IDL.Opt(KnownNeuronData),
  });
  const FulfillSubnetRentalRequest = IDL.Record({
    user: IDL.Opt(IDL.Principal),
    replica_version_id: IDL.Opt(IDL.Text),
    node_ids: IDL.Opt(IDL.Vec(IDL.Principal)),
  });
  const Spawn = IDL.Record({
    percentage_to_spawn: IDL.Opt(IDL.Nat32),
    new_controller: IDL.Opt(IDL.Principal),
    nonce: IDL.Opt(IDL.Nat64),
  });
  const Split = IDL.Record({
    memo: IDL.Opt(IDL.Nat64),
    amount_e8s: IDL.Nat64,
  });
  const Follow = IDL.Record({
    topic: IDL.Int32,
    followees: IDL.Vec(NeuronId),
  });
  const Account = IDL.Record({
    owner: IDL.Opt(IDL.Principal),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const DisburseMaturity = IDL.Record({
    to_account_identifier: IDL.Opt(AccountIdentifier),
    to_account: IDL.Opt(Account),
    percentage_to_disburse: IDL.Nat32,
  });
  const RefreshVotingPower = IDL.Record({});
  const ClaimOrRefreshNeuronFromAccount = IDL.Record({
    controller: IDL.Opt(IDL.Principal),
    memo: IDL.Nat64,
  });
  const By = IDL.Variant({
    NeuronIdOrSubaccount: IDL.Record({}),
    MemoAndController: ClaimOrRefreshNeuronFromAccount,
    Memo: IDL.Nat64,
  });
  const ClaimOrRefresh = IDL.Record({ by: IDL.Opt(By) });
  const RemoveHotKey = IDL.Record({
    hot_key_to_remove: IDL.Opt(IDL.Principal),
  });
  const AddHotKey = IDL.Record({ new_hot_key: IDL.Opt(IDL.Principal) });
  const ChangeAutoStakeMaturity = IDL.Record({
    requested_setting_for_auto_stake_maturity: IDL.Bool,
  });
  const IncreaseDissolveDelay = IDL.Record({
    additional_dissolve_delay_seconds: IDL.Nat32,
  });
  const SetVisibility = IDL.Record({ visibility: IDL.Opt(IDL.Int32) });
  const SetDissolveTimestamp = IDL.Record({
    dissolve_timestamp_seconds: IDL.Nat64,
  });
  const Operation = IDL.Variant({
    RemoveHotKey: RemoveHotKey,
    AddHotKey: AddHotKey,
    ChangeAutoStakeMaturity: ChangeAutoStakeMaturity,
    StopDissolving: IDL.Record({}),
    StartDissolving: IDL.Record({}),
    IncreaseDissolveDelay: IncreaseDissolveDelay,
    SetVisibility: SetVisibility,
    JoinCommunityFund: IDL.Record({}),
    LeaveCommunityFund: IDL.Record({}),
    SetDissolveTimestamp: SetDissolveTimestamp,
  });
  const Configure = IDL.Record({ operation: IDL.Opt(Operation) });
  const RegisterVote = IDL.Record({
    vote: IDL.Int32,
    proposal: IDL.Opt(ProposalId),
  });
  const Merge = IDL.Record({ source_neuron_id: IDL.Opt(NeuronId) });
  const DisburseToNeuron = IDL.Record({
    dissolve_delay_seconds: IDL.Nat64,
    kyc_verified: IDL.Bool,
    amount_e8s: IDL.Nat64,
    new_controller: IDL.Opt(IDL.Principal),
    nonce: IDL.Nat64,
  });
  const FolloweesForTopic = IDL.Record({
    topic: IDL.Opt(IDL.Int32),
    followees: IDL.Opt(IDL.Vec(NeuronId)),
  });
  const SetFollowing = IDL.Record({
    topic_following: IDL.Opt(IDL.Vec(FolloweesForTopic)),
  });
  const StakeMaturity = IDL.Record({
    percentage_to_stake: IDL.Opt(IDL.Nat32),
  });
  const MergeMaturity = IDL.Record({ percentage_to_merge: IDL.Nat32 });
  const Amount = IDL.Record({ e8s: IDL.Nat64 });
  const Disburse = IDL.Record({
    to_account: IDL.Opt(AccountIdentifier),
    amount: IDL.Opt(Amount),
  });
  const Command = IDL.Variant({
    Spawn: Spawn,
    Split: Split,
    Follow: Follow,
    DisburseMaturity: DisburseMaturity,
    RefreshVotingPower: RefreshVotingPower,
    ClaimOrRefresh: ClaimOrRefresh,
    Configure: Configure,
    RegisterVote: RegisterVote,
    Merge: Merge,
    DisburseToNeuron: DisburseToNeuron,
    SetFollowing: SetFollowing,
    MakeProposal: Proposal,
    StakeMaturity: StakeMaturity,
    MergeMaturity: MergeMaturity,
    Disburse: Disburse,
  });
  const NeuronIdOrSubaccount = IDL.Variant({
    Subaccount: IDL.Vec(IDL.Nat8),
    NeuronId: NeuronId,
  });
  const ManageNeuron = IDL.Record({
    id: IDL.Opt(NeuronId),
    command: IDL.Opt(Command),
    neuron_id_or_subaccount: IDL.Opt(NeuronIdOrSubaccount),
  });
  const Controllers = IDL.Record({ controllers: IDL.Vec(IDL.Principal) });
  const CanisterSettings = IDL.Record({
    freezing_threshold: IDL.Opt(IDL.Nat64),
    wasm_memory_threshold: IDL.Opt(IDL.Nat64),
    controllers: IDL.Opt(Controllers),
    log_visibility: IDL.Opt(IDL.Int32),
    wasm_memory_limit: IDL.Opt(IDL.Nat64),
    memory_allocation: IDL.Opt(IDL.Nat64),
    compute_allocation: IDL.Opt(IDL.Nat64),
  });
  const UpdateCanisterSettings = IDL.Record({
    canister_id: IDL.Opt(IDL.Principal),
    settings: IDL.Opt(CanisterSettings),
  });
  const InstallCode = IDL.Record({
    skip_stopping_before_installing: IDL.Opt(IDL.Bool),
    wasm_module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
    canister_id: IDL.Opt(IDL.Principal),
    arg_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
    install_mode: IDL.Opt(IDL.Int32),
  });
  const DeregisterKnownNeuron = IDL.Record({ id: IDL.Opt(NeuronId) });
  const StopOrStartCanister = IDL.Record({
    action: IDL.Opt(IDL.Int32),
    canister_id: IDL.Opt(IDL.Principal),
  });
  const Duration = IDL.Record({ seconds: IDL.Opt(IDL.Nat64) });
  const Tokens = IDL.Record({ e8s: IDL.Opt(IDL.Nat64) });
  const VotingRewardParameters = IDL.Record({
    reward_rate_transition_duration: IDL.Opt(Duration),
    initial_reward_rate: IDL.Opt(Percentage),
    final_reward_rate: IDL.Opt(Percentage),
  });
  const GovernanceParameters = IDL.Record({
    neuron_maximum_dissolve_delay_bonus: IDL.Opt(Percentage),
    neuron_maximum_age_for_age_bonus: IDL.Opt(Duration),
    neuron_maximum_dissolve_delay: IDL.Opt(Duration),
    neuron_minimum_dissolve_delay_to_vote: IDL.Opt(Duration),
    neuron_maximum_age_bonus: IDL.Opt(Percentage),
    neuron_minimum_stake: IDL.Opt(Tokens),
    proposal_wait_for_quiet_deadline_increase: IDL.Opt(Duration),
    proposal_initial_voting_period: IDL.Opt(Duration),
    proposal_rejection_fee: IDL.Opt(Tokens),
    voting_reward_parameters: IDL.Opt(VotingRewardParameters),
  });
  const Image = IDL.Record({ base64_encoding: IDL.Opt(IDL.Text) });
  const LedgerParameters = IDL.Record({
    transaction_fee: IDL.Opt(Tokens),
    token_symbol: IDL.Opt(IDL.Text),
    token_logo: IDL.Opt(Image),
    token_name: IDL.Opt(IDL.Text),
  });
  const Canister = IDL.Record({ id: IDL.Opt(IDL.Principal) });
  const NeuronBasketConstructionParameters = IDL.Record({
    dissolve_delay_interval: IDL.Opt(Duration),
    count: IDL.Opt(IDL.Nat64),
  });
  const GlobalTimeOfDay = IDL.Record({
    seconds_after_utc_midnight: IDL.Opt(IDL.Nat64),
  });
  const Countries = IDL.Record({ iso_codes: IDL.Vec(IDL.Text) });
  const SwapParameters = IDL.Record({
    minimum_participants: IDL.Opt(IDL.Nat64),
    neurons_fund_participation: IDL.Opt(IDL.Bool),
    duration: IDL.Opt(Duration),
    neuron_basket_construction_parameters: IDL.Opt(
      NeuronBasketConstructionParameters,
    ),
    confirmation_text: IDL.Opt(IDL.Text),
    maximum_participant_icp: IDL.Opt(Tokens),
    minimum_icp: IDL.Opt(Tokens),
    minimum_direct_participation_icp: IDL.Opt(Tokens),
    minimum_participant_icp: IDL.Opt(Tokens),
    start_time: IDL.Opt(GlobalTimeOfDay),
    maximum_direct_participation_icp: IDL.Opt(Tokens),
    maximum_icp: IDL.Opt(Tokens),
    neurons_fund_investment_icp: IDL.Opt(Tokens),
    restricted_countries: IDL.Opt(Countries),
  });
  const SwapDistribution = IDL.Record({ total: IDL.Opt(Tokens) });
  const NeuronDistribution = IDL.Record({
    controller: IDL.Opt(IDL.Principal),
    dissolve_delay: IDL.Opt(Duration),
    memo: IDL.Opt(IDL.Nat64),
    vesting_period: IDL.Opt(Duration),
    stake: IDL.Opt(Tokens),
  });
  const DeveloperDistribution = IDL.Record({
    developer_neurons: IDL.Vec(NeuronDistribution),
  });
  const InitialTokenDistribution = IDL.Record({
    treasury_distribution: IDL.Opt(SwapDistribution),
    developer_distribution: IDL.Opt(DeveloperDistribution),
    swap_distribution: IDL.Opt(SwapDistribution),
  });
  const CreateServiceNervousSystem = IDL.Record({
    url: IDL.Opt(IDL.Text),
    governance_parameters: IDL.Opt(GovernanceParameters),
    fallback_controller_principal_ids: IDL.Vec(IDL.Principal),
    logo: IDL.Opt(Image),
    name: IDL.Opt(IDL.Text),
    ledger_parameters: IDL.Opt(LedgerParameters),
    description: IDL.Opt(IDL.Text),
    dapp_canisters: IDL.Vec(Canister),
    swap_parameters: IDL.Opt(SwapParameters),
    initial_token_distribution: IDL.Opt(InitialTokenDistribution),
  });
  const ExecuteNnsFunction = IDL.Record({
    nns_function: IDL.Int32,
    payload: IDL.Vec(IDL.Nat8),
  });
  const NeuronBasketConstructionParameters_1 = IDL.Record({
    dissolve_delay_interval_seconds: IDL.Nat64,
    count: IDL.Nat64,
  });
  const Params = IDL.Record({
    min_participant_icp_e8s: IDL.Nat64,
    neuron_basket_construction_parameters: IDL.Opt(
      NeuronBasketConstructionParameters_1,
    ),
    max_icp_e8s: IDL.Nat64,
    swap_due_timestamp_seconds: IDL.Nat64,
    min_participants: IDL.Nat32,
    sns_token_e8s: IDL.Nat64,
    sale_delay_seconds: IDL.Opt(IDL.Nat64),
    max_participant_icp_e8s: IDL.Nat64,
    min_direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    min_icp_e8s: IDL.Nat64,
    max_direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
  });
  const OpenSnsTokenSwap = IDL.Record({
    community_fund_investment_e8s: IDL.Opt(IDL.Nat64),
    target_swap_canister_id: IDL.Opt(IDL.Principal),
    params: IDL.Opt(Params),
  });
  const TimeWindow = IDL.Record({
    start_timestamp_seconds: IDL.Nat64,
    end_timestamp_seconds: IDL.Nat64,
  });
  const SetOpenTimeWindowRequest = IDL.Record({
    open_time_window: IDL.Opt(TimeWindow),
  });
  const SetSnsTokenSwapOpenTimeWindow = IDL.Record({
    request: IDL.Opt(SetOpenTimeWindowRequest),
    swap_canister_id: IDL.Opt(IDL.Principal),
  });
  const SetDefaultFollowees = IDL.Record({
    default_followees: IDL.Vec(IDL.Tuple(IDL.Int32, Followees)),
  });
  const RewardNodeProviders = IDL.Record({
    use_registry_derived_rewards: IDL.Opt(IDL.Bool),
    rewards: IDL.Vec(RewardNodeProvider),
  });
  const Principals = IDL.Record({ principals: IDL.Vec(IDL.Principal) });
  const Change = IDL.Variant({
    ToRemove: NodeProvider,
    ToAdd: NodeProvider,
  });
  const AddOrRemoveNodeProvider = IDL.Record({ change: IDL.Opt(Change) });
  const Motion = IDL.Record({ motion_text: IDL.Text });
  const Action = IDL.Variant({
    RegisterKnownNeuron: KnownNeuron,
    FulfillSubnetRentalRequest: FulfillSubnetRentalRequest,
    ManageNeuron: ManageNeuron,
    UpdateCanisterSettings: UpdateCanisterSettings,
    InstallCode: InstallCode,
    DeregisterKnownNeuron: DeregisterKnownNeuron,
    StopOrStartCanister: StopOrStartCanister,
    CreateServiceNervousSystem: CreateServiceNervousSystem,
    ExecuteNnsFunction: ExecuteNnsFunction,
    RewardNodeProvider: RewardNodeProvider,
    OpenSnsTokenSwap: OpenSnsTokenSwap,
    SetSnsTokenSwapOpenTimeWindow: SetSnsTokenSwapOpenTimeWindow,
    SetDefaultFollowees: SetDefaultFollowees,
    RewardNodeProviders: RewardNodeProviders,
    ManageNetworkEconomics: NetworkEconomics,
    ApproveGenesisKyc: Principals,
    AddOrRemoveNodeProvider: AddOrRemoveNodeProvider,
    Motion: Motion,
  });
  Proposal.fill(
    IDL.Record({
      url: IDL.Text,
      title: IDL.Opt(IDL.Text),
      action: IDL.Opt(Action),
      summary: IDL.Text,
    }),
  );
  const WaitForQuietState = IDL.Record({
    current_deadline_timestamp_seconds: IDL.Nat64,
  });
  const ProposalData = IDL.Record({
    id: IDL.Opt(ProposalId),
    topic: IDL.Opt(IDL.Int32),
    failure_reason: IDL.Opt(GovernanceError),
    ballots: IDL.Vec(IDL.Tuple(IDL.Nat64, Ballot)),
    proposal_timestamp_seconds: IDL.Nat64,
    reward_event_round: IDL.Nat64,
    failed_timestamp_seconds: IDL.Nat64,
    neurons_fund_data: IDL.Opt(NeuronsFundData),
    reject_cost_e8s: IDL.Nat64,
    derived_proposal_information: IDL.Opt(DerivedProposalInformation),
    latest_tally: IDL.Opt(Tally),
    total_potential_voting_power: IDL.Opt(IDL.Nat64),
    sns_token_swap_lifecycle: IDL.Opt(IDL.Int32),
    decided_timestamp_seconds: IDL.Nat64,
    proposal: IDL.Opt(Proposal),
    proposer: IDL.Opt(NeuronId),
    wait_for_quiet_state: IDL.Opt(WaitForQuietState),
    executed_timestamp_seconds: IDL.Nat64,
    original_total_community_fund_maturity_e8s_equivalent: IDL.Opt(IDL.Nat64),
  });
  const Command_2 = IDL.Variant({
    Spawn: NeuronId,
    Split: Split,
    Configure: Configure,
    Merge: Merge,
    DisburseToNeuron: DisburseToNeuron,
    SyncCommand: IDL.Record({}),
    ClaimOrRefreshNeuron: ClaimOrRefresh,
    MergeMaturity: MergeMaturity,
    Disburse: Disburse,
  });
  const NeuronInFlightCommand = IDL.Record({
    command: IDL.Opt(Command_2),
    timestamp: IDL.Nat64,
  });
  const BallotInfo = IDL.Record({
    vote: IDL.Int32,
    proposal_id: IDL.Opt(ProposalId),
  });
  const MaturityDisbursement = IDL.Record({
    account_identifier_to_disburse_to: IDL.Opt(AccountIdentifier),
    timestamp_of_disbursement_seconds: IDL.Opt(IDL.Nat64),
    amount_e8s: IDL.Opt(IDL.Nat64),
    account_to_disburse_to: IDL.Opt(Account),
    finalize_disbursement_timestamp_seconds: IDL.Opt(IDL.Nat64),
  });
  const DissolveState = IDL.Variant({
    DissolveDelaySeconds: IDL.Nat64,
    WhenDissolvedTimestampSeconds: IDL.Nat64,
  });
  const Neuron = IDL.Record({
    id: IDL.Opt(NeuronId),
    staked_maturity_e8s_equivalent: IDL.Opt(IDL.Nat64),
    controller: IDL.Opt(IDL.Principal),
    recent_ballots: IDL.Vec(BallotInfo),
    voting_power_refreshed_timestamp_seconds: IDL.Opt(IDL.Nat64),
    kyc_verified: IDL.Bool,
    potential_voting_power: IDL.Opt(IDL.Nat64),
    neuron_type: IDL.Opt(IDL.Int32),
    not_for_profit: IDL.Bool,
    maturity_e8s_equivalent: IDL.Nat64,
    deciding_voting_power: IDL.Opt(IDL.Nat64),
    cached_neuron_stake_e8s: IDL.Nat64,
    created_timestamp_seconds: IDL.Nat64,
    auto_stake_maturity: IDL.Opt(IDL.Bool),
    aging_since_timestamp_seconds: IDL.Nat64,
    hot_keys: IDL.Vec(IDL.Principal),
    account: IDL.Vec(IDL.Nat8),
    joined_community_fund_timestamp_seconds: IDL.Opt(IDL.Nat64),
    maturity_disbursements_in_progress: IDL.Opt(IDL.Vec(MaturityDisbursement)),
    dissolve_state: IDL.Opt(DissolveState),
    followees: IDL.Vec(IDL.Tuple(IDL.Int32, Followees)),
    neuron_fees_e8s: IDL.Nat64,
    visibility: IDL.Opt(IDL.Int32),
    transfer: IDL.Opt(NeuronStakeTransfer),
    known_neuron_data: IDL.Opt(KnownNeuronData),
    spawn_at_timestamp_seconds: IDL.Opt(IDL.Nat64),
  });
  const Governance = IDL.Record({
    default_followees: IDL.Vec(IDL.Tuple(IDL.Int32, Followees)),
    most_recent_monthly_node_provider_rewards: IDL.Opt(
      MonthlyNodeProviderRewards,
    ),
    maturity_modulation_last_updated_at_timestamp_seconds: IDL.Opt(IDL.Nat64),
    wait_for_quiet_threshold_seconds: IDL.Nat64,
    metrics: IDL.Opt(GovernanceCachedMetrics),
    neuron_management_voting_period_seconds: IDL.Opt(IDL.Nat64),
    node_providers: IDL.Vec(NodeProvider),
    cached_daily_maturity_modulation_basis_points: IDL.Opt(IDL.Int32),
    economics: IDL.Opt(NetworkEconomics),
    restore_aging_summary: IDL.Opt(RestoreAgingSummary),
    spawning_neurons: IDL.Opt(IDL.Bool),
    latest_reward_event: IDL.Opt(RewardEvent),
    to_claim_transfers: IDL.Vec(NeuronStakeTransfer),
    short_voting_period_seconds: IDL.Nat64,
    proposals: IDL.Vec(IDL.Tuple(IDL.Nat64, ProposalData)),
    xdr_conversion_rate: IDL.Opt(XdrConversionRate),
    in_flight_commands: IDL.Vec(IDL.Tuple(IDL.Nat64, NeuronInFlightCommand)),
    neurons: IDL.Vec(IDL.Tuple(IDL.Nat64, Neuron)),
    genesis_timestamp_seconds: IDL.Nat64,
  });
  const Result = IDL.Variant({ Ok: IDL.Null, Err: GovernanceError });
  const Result_1 = IDL.Variant({
    Error: GovernanceError,
    NeuronId: NeuronId,
  });
  const ClaimOrRefreshNeuronFromAccountResponse = IDL.Record({
    result: IDL.Opt(Result_1),
  });
  const Result_2 = IDL.Variant({ Ok: Neuron, Err: GovernanceError });
  const Result_3 = IDL.Variant({
    Ok: GovernanceCachedMetrics,
    Err: GovernanceError,
  });
  const Result_4 = IDL.Variant({
    Ok: MonthlyNodeProviderRewards,
    Err: GovernanceError,
  });
  const GetNeuronIndexRequest = IDL.Record({
    page_size: IDL.Opt(IDL.Nat32),
    exclusive_start_neuron_id: IDL.Opt(NeuronId),
  });
  const NeuronInfo = IDL.Record({
    dissolve_delay_seconds: IDL.Nat64,
    recent_ballots: IDL.Vec(BallotInfo),
    voting_power_refreshed_timestamp_seconds: IDL.Opt(IDL.Nat64),
    potential_voting_power: IDL.Opt(IDL.Nat64),
    neuron_type: IDL.Opt(IDL.Int32),
    deciding_voting_power: IDL.Opt(IDL.Nat64),
    created_timestamp_seconds: IDL.Nat64,
    state: IDL.Int32,
    stake_e8s: IDL.Nat64,
    joined_community_fund_timestamp_seconds: IDL.Opt(IDL.Nat64),
    retrieved_at_timestamp_seconds: IDL.Nat64,
    visibility: IDL.Opt(IDL.Int32),
    known_neuron_data: IDL.Opt(KnownNeuronData),
    voting_power: IDL.Nat64,
    age_seconds: IDL.Nat64,
  });
  const NeuronIndexData = IDL.Record({ neurons: IDL.Vec(NeuronInfo) });
  const GetNeuronIndexResult = IDL.Variant({
    Ok: NeuronIndexData,
    Err: GovernanceError,
  });
  const Result_5 = IDL.Variant({ Ok: NeuronInfo, Err: GovernanceError });
  const GetNeuronsFundAuditInfoRequest = IDL.Record({
    nns_proposal_id: IDL.Opt(ProposalId),
  });
  const NeuronsFundAuditInfo = IDL.Record({
    final_neurons_fund_participation: IDL.Opt(NeuronsFundParticipation),
    initial_neurons_fund_participation: IDL.Opt(NeuronsFundParticipation),
    neurons_fund_refunds: IDL.Opt(NeuronsFundSnapshot),
  });
  const Ok = IDL.Record({
    neurons_fund_audit_info: IDL.Opt(NeuronsFundAuditInfo),
  });
  const Result_6 = IDL.Variant({ Ok: Ok, Err: GovernanceError });
  const GetNeuronsFundAuditInfoResponse = IDL.Record({
    result: IDL.Opt(Result_6),
  });
  const Result_7 = IDL.Variant({
    Ok: NodeProvider,
    Err: GovernanceError,
  });
  const ProposalInfo = IDL.Record({
    id: IDL.Opt(ProposalId),
    status: IDL.Int32,
    topic: IDL.Int32,
    failure_reason: IDL.Opt(GovernanceError),
    ballots: IDL.Vec(IDL.Tuple(IDL.Nat64, Ballot)),
    proposal_timestamp_seconds: IDL.Nat64,
    reward_event_round: IDL.Nat64,
    deadline_timestamp_seconds: IDL.Opt(IDL.Nat64),
    failed_timestamp_seconds: IDL.Nat64,
    reject_cost_e8s: IDL.Nat64,
    derived_proposal_information: IDL.Opt(DerivedProposalInformation),
    latest_tally: IDL.Opt(Tally),
    total_potential_voting_power: IDL.Opt(IDL.Nat64),
    reward_status: IDL.Int32,
    decided_timestamp_seconds: IDL.Nat64,
    proposal: IDL.Opt(Proposal),
    proposer: IDL.Opt(NeuronId),
    executed_timestamp_seconds: IDL.Nat64,
  });
  const ListKnownNeuronsResponse = IDL.Record({
    known_neurons: IDL.Vec(KnownNeuron),
  });
  const NeuronSubaccount = IDL.Record({ subaccount: IDL.Vec(IDL.Nat8) });
  const ListNeurons = IDL.Record({
    page_size: IDL.Opt(IDL.Nat64),
    include_public_neurons_in_full_neurons: IDL.Opt(IDL.Bool),
    neuron_ids: IDL.Vec(IDL.Nat64),
    page_number: IDL.Opt(IDL.Nat64),
    include_empty_neurons_readable_by_caller: IDL.Opt(IDL.Bool),
    neuron_subaccounts: IDL.Opt(IDL.Vec(NeuronSubaccount)),
    include_neurons_readable_by_caller: IDL.Bool,
  });
  const ListNeuronsResponse = IDL.Record({
    neuron_infos: IDL.Vec(IDL.Tuple(IDL.Nat64, NeuronInfo)),
    full_neurons: IDL.Vec(Neuron),
    total_pages_available: IDL.Opt(IDL.Nat64),
  });
  const DateRangeFilter = IDL.Record({
    start_timestamp_seconds: IDL.Opt(IDL.Nat64),
    end_timestamp_seconds: IDL.Opt(IDL.Nat64),
  });
  const ListNodeProviderRewardsRequest = IDL.Record({
    date_filter: IDL.Opt(DateRangeFilter),
  });
  const ListNodeProviderRewardsResponse = IDL.Record({
    rewards: IDL.Vec(MonthlyNodeProviderRewards),
  });
  const ListNodeProvidersResponse = IDL.Record({
    node_providers: IDL.Vec(NodeProvider),
  });
  const ListProposalInfo = IDL.Record({
    include_reward_status: IDL.Vec(IDL.Int32),
    omit_large_fields: IDL.Opt(IDL.Bool),
    before_proposal: IDL.Opt(ProposalId),
    limit: IDL.Nat32,
    exclude_topic: IDL.Vec(IDL.Int32),
    include_all_manage_neuron_proposals: IDL.Opt(IDL.Bool),
    include_status: IDL.Vec(IDL.Int32),
  });
  const ListProposalInfoResponse = IDL.Record({
    proposal_info: IDL.Vec(ProposalInfo),
  });
  const InstallCodeRequest = IDL.Record({
    arg: IDL.Opt(IDL.Vec(IDL.Nat8)),
    wasm_module: IDL.Opt(IDL.Vec(IDL.Nat8)),
    skip_stopping_before_installing: IDL.Opt(IDL.Bool),
    canister_id: IDL.Opt(IDL.Principal),
    install_mode: IDL.Opt(IDL.Int32),
  });
  const ProposalActionRequest = IDL.Variant({
    RegisterKnownNeuron: KnownNeuron,
    FulfillSubnetRentalRequest: FulfillSubnetRentalRequest,
    ManageNeuron: ManageNeuronRequest,
    UpdateCanisterSettings: UpdateCanisterSettings,
    InstallCode: InstallCodeRequest,
    DeregisterKnownNeuron: DeregisterKnownNeuron,
    StopOrStartCanister: StopOrStartCanister,
    CreateServiceNervousSystem: CreateServiceNervousSystem,
    ExecuteNnsFunction: ExecuteNnsFunction,
    RewardNodeProvider: RewardNodeProvider,
    RewardNodeProviders: RewardNodeProviders,
    ManageNetworkEconomics: NetworkEconomics,
    ApproveGenesisKyc: Principals,
    AddOrRemoveNodeProvider: AddOrRemoveNodeProvider,
    Motion: Motion,
  });
  const MakeProposalRequest = IDL.Record({
    url: IDL.Text,
    title: IDL.Opt(IDL.Text),
    action: IDL.Opt(ProposalActionRequest),
    summary: IDL.Text,
  });
  const ManageNeuronCommandRequest = IDL.Variant({
    Spawn: Spawn,
    Split: Split,
    Follow: Follow,
    DisburseMaturity: DisburseMaturity,
    RefreshVotingPower: RefreshVotingPower,
    ClaimOrRefresh: ClaimOrRefresh,
    Configure: Configure,
    RegisterVote: RegisterVote,
    Merge: Merge,
    DisburseToNeuron: DisburseToNeuron,
    SetFollowing: SetFollowing,
    MakeProposal: MakeProposalRequest,
    StakeMaturity: StakeMaturity,
    MergeMaturity: MergeMaturity,
    Disburse: Disburse,
  });
  ManageNeuronRequest.fill(
    IDL.Record({
      id: IDL.Opt(NeuronId),
      command: IDL.Opt(ManageNeuronCommandRequest),
      neuron_id_or_subaccount: IDL.Opt(NeuronIdOrSubaccount),
    }),
  );
  const SpawnResponse = IDL.Record({ created_neuron_id: IDL.Opt(NeuronId) });
  const DisburseMaturityResponse = IDL.Record({
    amount_disbursed_e8s: IDL.Opt(IDL.Nat64),
  });
  const RefreshVotingPowerResponse = IDL.Record({});
  const ClaimOrRefreshResponse = IDL.Record({
    refreshed_neuron_id: IDL.Opt(NeuronId),
  });
  const MergeResponse = IDL.Record({
    target_neuron: IDL.Opt(Neuron),
    source_neuron: IDL.Opt(Neuron),
    target_neuron_info: IDL.Opt(NeuronInfo),
    source_neuron_info: IDL.Opt(NeuronInfo),
  });
  const SetFollowingResponse = IDL.Record({});
  const MakeProposalResponse = IDL.Record({
    message: IDL.Opt(IDL.Text),
    proposal_id: IDL.Opt(ProposalId),
  });
  const StakeMaturityResponse = IDL.Record({
    maturity_e8s: IDL.Nat64,
    staked_maturity_e8s: IDL.Nat64,
  });
  const MergeMaturityResponse = IDL.Record({
    merged_maturity_e8s: IDL.Nat64,
    new_stake_e8s: IDL.Nat64,
  });
  const DisburseResponse = IDL.Record({ transfer_block_height: IDL.Nat64 });
  const Command_1 = IDL.Variant({
    Error: GovernanceError,
    Spawn: SpawnResponse,
    Split: SpawnResponse,
    Follow: IDL.Record({}),
    DisburseMaturity: DisburseMaturityResponse,
    RefreshVotingPower: RefreshVotingPowerResponse,
    ClaimOrRefresh: ClaimOrRefreshResponse,
    Configure: IDL.Record({}),
    RegisterVote: IDL.Record({}),
    Merge: MergeResponse,
    DisburseToNeuron: SpawnResponse,
    SetFollowing: SetFollowingResponse,
    MakeProposal: MakeProposalResponse,
    StakeMaturity: StakeMaturityResponse,
    MergeMaturity: MergeMaturityResponse,
    Disburse: DisburseResponse,
  });
  const ManageNeuronResponse = IDL.Record({ command: IDL.Opt(Command_1) });
  const Committed = IDL.Record({
    total_direct_contribution_icp_e8s: IDL.Opt(IDL.Nat64),
    total_neurons_fund_contribution_icp_e8s: IDL.Opt(IDL.Nat64),
    sns_governance_canister_id: IDL.Opt(IDL.Principal),
  });
  const Result_8 = IDL.Variant({
    Committed: Committed,
    Aborted: IDL.Record({}),
  });
  const SettleCommunityFundParticipation = IDL.Record({
    result: IDL.Opt(Result_8),
    open_sns_token_swap_proposal_id: IDL.Opt(IDL.Nat64),
  });
  const Committed_1 = IDL.Record({
    total_direct_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    total_neurons_fund_participation_icp_e8s: IDL.Opt(IDL.Nat64),
    sns_governance_canister_id: IDL.Opt(IDL.Principal),
  });
  const Result_9 = IDL.Variant({
    Committed: Committed_1,
    Aborted: IDL.Record({}),
  });
  const SettleNeuronsFundParticipationRequest = IDL.Record({
    result: IDL.Opt(Result_9),
    nns_proposal_id: IDL.Opt(IDL.Nat64),
  });
  const NeuronsFundNeuron = IDL.Record({
    controller: IDL.Opt(IDL.Principal),
    hotkeys: IDL.Opt(Principals),
    is_capped: IDL.Opt(IDL.Bool),
    nns_neuron_id: IDL.Opt(IDL.Nat64),
    amount_icp_e8s: IDL.Opt(IDL.Nat64),
  });
  const Ok_1 = IDL.Record({
    neurons_fund_neuron_portions: IDL.Vec(NeuronsFundNeuron),
  });
  const Result_10 = IDL.Variant({ Ok: Ok_1, Err: GovernanceError });
  const SettleNeuronsFundParticipationResponse = IDL.Record({
    result: IDL.Opt(Result_10),
  });
  const UpdateNodeProvider = IDL.Record({
    reward_account: IDL.Opt(AccountIdentifier),
  });
  return IDL.Service({
    claim_gtc_neurons: IDL.Func(
      [IDL.Principal, IDL.Vec(NeuronId)],
      [Result],
      [],
    ),
    claim_or_refresh_neuron_from_account: IDL.Func(
      [ClaimOrRefreshNeuronFromAccount],
      [ClaimOrRefreshNeuronFromAccountResponse],
      [],
    ),
    get_build_metadata: IDL.Func([], [IDL.Text], ["query"]),
    get_full_neuron: IDL.Func([IDL.Nat64], [Result_2], ["query"]),
    get_full_neuron_by_id_or_subaccount: IDL.Func(
      [NeuronIdOrSubaccount],
      [Result_2],
      ["query"],
    ),
    get_latest_reward_event: IDL.Func([], [RewardEvent], ["query"]),
    get_metrics: IDL.Func([], [Result_3], ["query"]),
    get_monthly_node_provider_rewards: IDL.Func([], [Result_4], []),
    get_most_recent_monthly_node_provider_rewards: IDL.Func(
      [],
      [IDL.Opt(MonthlyNodeProviderRewards)],
      ["query"],
    ),
    get_network_economics_parameters: IDL.Func(
      [],
      [NetworkEconomics],
      ["query"],
    ),
    get_neuron_ids: IDL.Func([], [IDL.Vec(IDL.Nat64)], ["query"]),
    get_neuron_index: IDL.Func(
      [GetNeuronIndexRequest],
      [GetNeuronIndexResult],
      ["query"],
    ),
    get_neuron_info: IDL.Func([IDL.Nat64], [Result_5], ["query"]),
    get_neuron_info_by_id_or_subaccount: IDL.Func(
      [NeuronIdOrSubaccount],
      [Result_5],
      ["query"],
    ),
    get_neurons_fund_audit_info: IDL.Func(
      [GetNeuronsFundAuditInfoRequest],
      [GetNeuronsFundAuditInfoResponse],
      ["query"],
    ),
    get_node_provider_by_caller: IDL.Func([IDL.Null], [Result_7], ["query"]),
    get_pending_proposals: IDL.Func([], [IDL.Vec(ProposalInfo)], ["query"]),
    get_proposal_info: IDL.Func(
      [IDL.Nat64],
      [IDL.Opt(ProposalInfo)],
      ["query"],
    ),
    get_restore_aging_summary: IDL.Func([], [RestoreAgingSummary], ["query"]),
    list_known_neurons: IDL.Func([], [ListKnownNeuronsResponse], ["query"]),
    list_neurons: IDL.Func([ListNeurons], [ListNeuronsResponse], ["query"]),
    list_node_provider_rewards: IDL.Func(
      [ListNodeProviderRewardsRequest],
      [ListNodeProviderRewardsResponse],
      ["query"],
    ),
    list_node_providers: IDL.Func([], [ListNodeProvidersResponse], ["query"]),
    list_proposals: IDL.Func(
      [ListProposalInfo],
      [ListProposalInfoResponse],
      ["query"],
    ),
    manage_neuron: IDL.Func([ManageNeuronRequest], [ManageNeuronResponse], []),
    settle_community_fund_participation: IDL.Func(
      [SettleCommunityFundParticipation],
      [Result],
      [],
    ),
    settle_neurons_fund_participation: IDL.Func(
      [SettleNeuronsFundParticipationRequest],
      [SettleNeuronsFundParticipationResponse],
      [],
    ),
    simulate_manage_neuron: IDL.Func(
      [ManageNeuronRequest],
      [ManageNeuronResponse],
      [],
    ),
    transfer_gtc_neuron: IDL.Func([NeuronId, NeuronId], [Result], []),
    update_node_provider: IDL.Func([UpdateNodeProvider], [Result], []),
  });
};
