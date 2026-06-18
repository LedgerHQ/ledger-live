import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { NavigatorName, ScreenName } from "~/const";

export type AccountKey =
  | "algorand"
  | "cardano"
  | "celo"
  | "cosmos"
  | "ethereum"
  | "hedera"
  | "multiversx"
  | "near"
  | "polkadot"
  | "solana"
  | "sui"
  | "tezos";

export type StakePromptBucket =
  | "delegation/staking"
  | "redelegation/rebond"
  | "undelegation/unstaking"
  | "withdrawing/withdraw"
  | "revoke/claim/lifecycle";

export type StakePromptCase = {
  label: string;
  bucket: StakePromptBucket;
  flowName: NavigatorName;
  familyExportKey: string;
  successScreenName: ScreenName;
  errorScreenName?: ScreenName;
  accountKey: AccountKey;
  operationType: string;
  transaction: Record<string, unknown>;
  params?: Record<string, unknown>;
};

export type MobileFamilyFlowExport = StakePromptCase["familyExportKey"];

export const accountsByKey = {
  algorand: genAccount("notifications-prompt-algorand", {
    currency: getCryptoCurrencyById("algorand"),
  }),
  cardano: genAccount("notifications-prompt-cardano", {
    currency: getCryptoCurrencyById("cardano"),
  }),
  celo: genAccount("notifications-prompt-celo", {
    currency: getCryptoCurrencyById("celo"),
  }),
  cosmos: genAccount("notifications-prompt-cosmos", {
    currency: getCryptoCurrencyById("cosmos"),
  }),
  ethereum: genAccount("notifications-prompt-ethereum", {
    currency: getCryptoCurrencyById("ethereum"),
  }),
  hedera: genAccount("notifications-prompt-hedera", {
    currency: getCryptoCurrencyById("hedera"),
  }),
  multiversx: genAccount("notifications-prompt-multiversx", {
    currency: getCryptoCurrencyById("elrond"),
  }),
  near: genAccount("notifications-prompt-near", {
    currency: getCryptoCurrencyById("near"),
  }),
  polkadot: {
    ...genAccount("notifications-prompt-polkadot", {
      currency: getCryptoCurrencyById("polkadot"),
    }),
    polkadotResources: {
      controller: "notifications-prompt-polkadot-controller",
    },
  },
  solana: genAccount("notifications-prompt-solana", {
    currency: getCryptoCurrencyById("solana"),
  }),
  sui: genAccount("notifications-prompt-sui", {
    currency: getCryptoCurrencyById("sui"),
  }),
  tezos: genAccount("notifications-prompt-tezos", {
    currency: getCryptoCurrencyById("tezos"),
  }),
};

export const createOperation = (accountId: string, type: string) => ({
  id: `${accountId}-${type.toLowerCase()}-operation`,
  hash: `${type.toLowerCase()}-operation-hash`,
  type,
  accountId,
});

export const stakePromptSource = { name: "NotificationsPromptStakeFlow" };
export const stakePromptCases: StakePromptCase[] = [
  {
    label: "Algorand claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.AlgorandClaimRewardsFlow,
    familyExportKey: "AlgorandClaimRewardsFlow",
    successScreenName: ScreenName.AlgorandClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.AlgorandClaimRewardsValidationError,
    accountKey: "algorand",
    operationType: "REWARD",
    transaction: { family: "algorand", mode: "claimRewards" },
  },
  {
    label: "Cardano delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.CardanoDelegationFlow,
    familyExportKey: "CardanoDelegationFlow",
    successScreenName: ScreenName.CardanoDelegationValidationSuccess,
    errorScreenName: ScreenName.CardanoDelegationValidationError,
    accountKey: "cardano",
    operationType: "DELEGATE",
    transaction: { family: "cardano", mode: "delegate" },
  },
  {
    label: "Cardano undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CardanoUndelegationFlow,
    familyExportKey: "CardanoUndelegationFlow",
    successScreenName: ScreenName.CardanoUndelegationValidationSuccess,
    errorScreenName: ScreenName.CardanoUndelegationValidationError,
    accountKey: "cardano",
    operationType: "UNDELEGATE",
    transaction: { family: "cardano", mode: "undelegate" },
  },
  {
    label: "Celo activate",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloActivateFlow,
    familyExportKey: "CeloActivateFlow",
    successScreenName: ScreenName.CeloActivateValidationSuccess,
    errorScreenName: ScreenName.CeloActivateValidationError,
    accountKey: "celo",
    operationType: "ACTIVATE",
    transaction: { family: "celo", mode: "activate" },
  },
  {
    label: "Celo lock",
    bucket: "delegation/staking",
    flowName: NavigatorName.CeloLockFlow,
    familyExportKey: "CeloLockFlow",
    successScreenName: ScreenName.CeloLockValidationSuccess,
    errorScreenName: ScreenName.CeloLockValidationError,
    accountKey: "celo",
    operationType: "LOCK",
    transaction: { family: "celo", mode: "lock" },
  },
  {
    label: "Celo registration",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloRegistrationFlow,
    familyExportKey: "CeloRegistrationFlow",
    successScreenName: ScreenName.CeloRegistrationValidationSuccess,
    errorScreenName: ScreenName.CeloRegistrationValidationError,
    accountKey: "celo",
    operationType: "REGISTER",
    transaction: { family: "celo", mode: "register" },
  },
  {
    label: "Celo revoke",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloRevokeFlow,
    familyExportKey: "CeloRevokeFlow",
    successScreenName: ScreenName.CeloRevokeValidationSuccess,
    errorScreenName: ScreenName.CeloRevokeValidationError,
    accountKey: "celo",
    operationType: "REVOKE",
    transaction: { family: "celo", mode: "revoke" },
  },
  {
    label: "Celo unlock",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CeloUnlockFlow,
    familyExportKey: "CeloUnlockFlow",
    successScreenName: ScreenName.CeloUnlockValidationSuccess,
    errorScreenName: ScreenName.CeloUnlockValidationError,
    accountKey: "celo",
    operationType: "UNLOCK",
    transaction: { family: "celo", mode: "unlock" },
  },
  {
    label: "Celo vote",
    bucket: "delegation/staking",
    flowName: NavigatorName.CeloVoteFlow,
    familyExportKey: "CeloVoteFlow",
    successScreenName: ScreenName.CeloVoteValidationSuccess,
    errorScreenName: ScreenName.CeloVoteValidationError,
    accountKey: "celo",
    operationType: "VOTE",
    transaction: { family: "celo", mode: "vote" },
  },
  {
    label: "Celo withdraw",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.CeloWithdrawFlow,
    familyExportKey: "CeloWithdrawFlow",
    successScreenName: ScreenName.CeloWithdrawValidationSuccess,
    errorScreenName: ScreenName.CeloWithdrawValidationError,
    accountKey: "celo",
    operationType: "WITHDRAW",
    transaction: { family: "celo", mode: "withdraw" },
  },
  {
    label: "Cosmos claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CosmosClaimRewardsFlow,
    familyExportKey: "CosmosClaimRewardsFlow",
    successScreenName: ScreenName.CosmosClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.CosmosClaimRewardsValidationError,
    accountKey: "cosmos",
    operationType: "REWARD",
    transaction: { family: "cosmos", mode: "claimReward" },
  },
  {
    label: "Cosmos delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.CosmosDelegationFlow,
    familyExportKey: "CosmosDelegationFlow",
    successScreenName: ScreenName.CosmosDelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosDelegationValidationError,
    accountKey: "cosmos",
    operationType: "DELEGATE",
    transaction: { family: "cosmos", mode: "delegate" },
    params: { validatorName: "cosmos-validator", source: stakePromptSource },
  },
  {
    label: "Cosmos redelegation",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.CosmosRedelegationFlow,
    familyExportKey: "CosmosRedelegationFlow",
    successScreenName: ScreenName.CosmosRedelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosRedelegationValidationError,
    accountKey: "cosmos",
    operationType: "REDELEGATE",
    transaction: { family: "cosmos", mode: "redelegate" },
    params: { validatorName: "cosmos-validator", source: stakePromptSource },
  },
  {
    label: "Cosmos undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CosmosUndelegationFlow,
    familyExportKey: "CosmosUndelegationFlow",
    successScreenName: ScreenName.CosmosUndelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosUndelegationValidationError,
    accountKey: "cosmos",
    operationType: "UNDELEGATE",
    transaction: { family: "cosmos", mode: "undelegate" },
  },
  {
    label: "EVM delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.EvmDelegationFlow,
    familyExportKey: "EvmDelegationFlow",
    successScreenName: ScreenName.EvmDelegationValidationSuccess,
    errorScreenName: ScreenName.EvmDelegationValidationError,
    accountKey: "ethereum",
    operationType: "DELEGATE",
    transaction: { family: "evm", mode: "delegate" },
    params: { validatorName: "evm-validator", source: stakePromptSource },
  },
  {
    label: "EVM undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.EvmUndelegationFlow,
    familyExportKey: "EvmUndelegationFlow",
    successScreenName: ScreenName.EvmUndelegationValidationSuccess,
    errorScreenName: ScreenName.EvmUndelegationValidationError,
    accountKey: "ethereum",
    operationType: "UNDELEGATE",
    transaction: { family: "evm", mode: "undelegate" },
  },
  {
    label: "EVM claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.EvmClaimRewardsFlow,
    familyExportKey: "EvmClaimRewardsFlow",
    successScreenName: ScreenName.EvmClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.EvmClaimRewardsValidationError,
    accountKey: "ethereum",
    operationType: "REWARD",
    transaction: { family: "evm", mode: "claimReward" },
  },
  {
    label: "EVM withdraw",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.EvmWithdrawFlow,
    familyExportKey: "EvmWithdrawFlow",
    successScreenName: ScreenName.EvmWithdrawValidationSuccess,
    errorScreenName: ScreenName.EvmWithdrawValidationError,
    accountKey: "ethereum",
    operationType: "WITHDRAW",
    // STUB (LIVE-31683): coin-evm has no "withdraw" mode yet, the flow self-sends.
    transaction: { family: "evm", mode: "send" },
  },
  {
    label: "Hedera claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.HederaClaimRewardsFlow,
    familyExportKey: "HederaClaimRewardsFlow",
    successScreenName: ScreenName.HederaClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.HederaClaimRewardsValidationError,
    accountKey: "hedera",
    operationType: "REWARD",
    transaction: { family: "hedera", mode: HEDERA_TRANSACTION_MODES.ClaimRewards },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.HederaDelegationFlow,
    familyExportKey: "HederaDelegationFlow",
    successScreenName: ScreenName.HederaDelegationValidationSuccess,
    errorScreenName: ScreenName.HederaDelegationValidationError,
    accountKey: "hedera",
    operationType: "DELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 1 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera redelegation",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.HederaRedelegationFlow,
    familyExportKey: "HederaRedelegationFlow",
    successScreenName: ScreenName.HederaRedelegationValidationSuccess,
    errorScreenName: ScreenName.HederaRedelegationValidationError,
    accountKey: "hedera",
    operationType: "REDELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Redelegate,
      properties: { stakingNodeId: 2 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.HederaUndelegationFlow,
    familyExportKey: "HederaUndelegationFlow",
    successScreenName: ScreenName.HederaUndelegationValidationSuccess,
    errorScreenName: ScreenName.HederaUndelegationValidationError,
    accountKey: "hedera",
    operationType: "UNDELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      properties: { stakingNodeId: 1 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "MultiversX claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.MultiversXClaimRewardsFlow,
    familyExportKey: "MultiversXClaimRewardsFlow",
    successScreenName: ScreenName.MultiversXClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.MultiversXClaimRewardsValidationError,
    accountKey: "multiversx",
    operationType: "REWARD",
    transaction: { family: "elrond", mode: "claimRewards" },
  },
  {
    label: "MultiversX delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.MultiversXDelegationFlow,
    familyExportKey: "MultiversXDelegationFlow",
    successScreenName: ScreenName.MultiversXDelegationValidationSuccess,
    errorScreenName: ScreenName.MultiversXDelegationValidationError,
    accountKey: "multiversx",
    operationType: "DELEGATE",
    transaction: { family: "elrond", mode: "delegate", recipient: "erd-validator" },
    params: {
      validators: [{ contract: "erd-validator", identity: { name: "MultiversX validator" } }],
      source: stakePromptSource,
    },
  },
  {
    label: "MultiversX undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.MultiversXUndelegationFlow,
    familyExportKey: "MultiversXUndelegationFlow",
    successScreenName: ScreenName.MultiversXUndelegationValidationSuccess,
    errorScreenName: ScreenName.MultiversXUndelegationValidationError,
    accountKey: "multiversx",
    operationType: "UNDELEGATE",
    transaction: { family: "elrond", mode: "undelegate" },
  },
  {
    label: "MultiversX withdraw",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.MultiversXWithdrawFlow,
    familyExportKey: "MultiversXWithdrawFlow",
    successScreenName: ScreenName.MultiversXWithdrawValidationSuccess,
    errorScreenName: ScreenName.MultiversXWithdrawValidationError,
    accountKey: "multiversx",
    operationType: "WITHDRAW",
    transaction: { family: "elrond", mode: "withdraw" },
  },
  {
    label: "Near staking",
    bucket: "delegation/staking",
    flowName: NavigatorName.NearStakingFlow,
    familyExportKey: "NearStakingFlow",
    successScreenName: ScreenName.NearStakingValidationSuccess,
    errorScreenName: ScreenName.NearStakingValidationError,
    accountKey: "near",
    operationType: "DELEGATE",
    transaction: { family: "near", mode: "stake", recipient: "near-validator" },
  },
  {
    label: "Near unstaking",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.NearUnstakingFlow,
    familyExportKey: "NearUnstakingFlow",
    successScreenName: ScreenName.NearUnstakingValidationSuccess,
    errorScreenName: ScreenName.NearUnstakingValidationError,
    accountKey: "near",
    operationType: "UNDELEGATE",
    transaction: { family: "near", mode: "unstake" },
  },
  {
    label: "Near withdrawing",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.NearWithdrawingFlow,
    familyExportKey: "NearWithdrawingFlow",
    successScreenName: ScreenName.NearWithdrawingValidationSuccess,
    errorScreenName: ScreenName.NearWithdrawingValidationError,
    accountKey: "near",
    operationType: "WITHDRAW",
    transaction: { family: "near", mode: "withdraw" },
  },
  {
    label: "Polkadot bond",
    bucket: "delegation/staking",
    flowName: NavigatorName.PolkadotBondFlow,
    familyExportKey: "PolkadotBondFlow",
    successScreenName: ScreenName.PolkadotBondValidationSuccess,
    errorScreenName: ScreenName.PolkadotBondValidationError,
    accountKey: "polkadot",
    operationType: "BOND",
    transaction: { family: "polkadot", mode: "bond" },
  },
  {
    label: "Polkadot nominate",
    bucket: "delegation/staking",
    flowName: NavigatorName.PolkadotNominateFlow,
    familyExportKey: "PolkadotNominateFlow",
    successScreenName: ScreenName.PolkadotNominateValidationSuccess,
    errorScreenName: ScreenName.PolkadotNominateValidationError,
    accountKey: "polkadot",
    operationType: "NOMINATE",
    transaction: { family: "polkadot", mode: "nominate" },
  },
  {
    label: "Polkadot rebond",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.PolkadotRebondFlow,
    familyExportKey: "PolkadotRebondFlow",
    successScreenName: ScreenName.PolkadotRebondValidationSuccess,
    errorScreenName: ScreenName.PolkadotRebondValidationError,
    accountKey: "polkadot",
    operationType: "REBOND",
    transaction: { family: "polkadot", mode: "rebond" },
  },
  {
    label: "Polkadot simple withdraw unbonded",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.PolkadotSimpleOperationFlow,
    familyExportKey: "PolkadotSimpleOperationFlow",
    successScreenName: ScreenName.PolkadotSimpleOperationValidationSuccess,
    errorScreenName: ScreenName.PolkadotSimpleOperationValidationError,
    accountKey: "polkadot",
    operationType: "WITHDRAW_UNBONDED",
    transaction: { family: "polkadot", mode: "withdrawUnbonded" },
    params: { mode: "withdrawUnbonded" },
  },
  {
    label: "Polkadot unbond",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.PolkadotUnbondFlow,
    familyExportKey: "PolkadotUnbondFlow",
    successScreenName: ScreenName.PolkadotUnbondValidationSuccess,
    errorScreenName: ScreenName.PolkadotUnbondValidationError,
    accountKey: "polkadot",
    operationType: "UNBOND",
    transaction: { family: "polkadot", mode: "unbond" },
  },
  {
    label: "Solana delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.SolanaDelegationFlow,
    familyExportKey: "SolanaDelegationFlow",
    successScreenName: ScreenName.DelegationValidationSuccess,
    errorScreenName: ScreenName.DelegationValidationError,
    accountKey: "solana",
    operationType: "DELEGATE",
    transaction: { family: "solana", mode: "delegate" },
    params: { validatorName: "solana-validator", source: stakePromptSource },
  },
  {
    label: "Sui staking",
    bucket: "delegation/staking",
    flowName: NavigatorName.SuiDelegateFlow,
    familyExportKey: "SuiDelegationFlow",
    successScreenName: ScreenName.SuiStakingValidationSuccess,
    errorScreenName: ScreenName.SuiStakingValidationError,
    accountKey: "sui",
    operationType: "DELEGATE",
    transaction: { family: "sui", mode: "stake", recipient: "sui-validator" },
    params: { source: stakePromptSource },
  },
  {
    label: "Sui unstaking",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.SuiUndelegateFlow,
    familyExportKey: "SuiUndelegateFlow",
    successScreenName: ScreenName.SuiUnstakingValidationSuccess,
    errorScreenName: ScreenName.SuiUnstakingValidationError,
    accountKey: "sui",
    operationType: "UNDELEGATE",
    transaction: { family: "sui", mode: "unstake" },
  },
  {
    label: "Tezos delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.TezosDelegationFlow,
    familyExportKey: "TezosDelegationFlow",
    successScreenName: ScreenName.DelegationValidationSuccess,
    errorScreenName: ScreenName.DelegationValidationError,
    accountKey: "tezos",
    operationType: "DELEGATE",
    transaction: { family: "tezos", mode: "delegate", recipient: "tz1-validator" },
    params: { source: stakePromptSource },
  },
];

export const STAKE_PROMPT_CASES_PER_CHUNK = 20;

export const stakePromptCaseChunks: StakePromptCase[][] = Array.from(
  { length: Math.ceil(stakePromptCases.length / STAKE_PROMPT_CASES_PER_CHUNK) },
  (_, index) =>
    stakePromptCases.slice(
      index * STAKE_PROMPT_CASES_PER_CHUNK,
      (index + 1) * STAKE_PROMPT_CASES_PER_CHUNK,
    ),
);
