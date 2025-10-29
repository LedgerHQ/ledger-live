import { register } from "react-native-bundle-splitter";

export const AlgorandEditMemo = register({
  loader: () =>
    import("~/families/algorand/ScreenEditMemoValue").then(m => ({ default: m.component })),
});
export const AlgorandClaimRewardsFlow = register({
  loader: () =>
    import("~/families/algorand/Rewards/ClaimRewardsFlow").then(m => ({ default: m.component })),
});
export const AlgorandOptInFlow = register({
  loader: () => import("~/families/algorand/OptInFlow").then(m => ({ default: m.component })),
});

export const BitcoinEditCustomFees = register({
  loader: () =>
    import("~/families/bitcoin/ScreenEditCustomFees").then(m => ({ default: m.component })),
});

export const CardanoEditMemo = register({
  loader: () => import("~/families/cardano/EditMemo").then(m => ({ default: m.component })),
});
export const CardanoDelegationFlow = register({
  loader: () => import("~/families/cardano/DelegationFlow").then(m => ({ default: m.component })),
});
export const CardanoUndelegationFlow = register({
  loader: () => import("~/families/cardano/UndelegationFlow").then(m => ({ default: m.component })),
});

export const CeloManageAssetsNavigator = register({
  loader: () =>
    import("~/families/celo/ManageAssetsNavigator").then(m => ({ default: m.component })),
});
export const CeloRegistrationFlow = register({
  loader: () => import("~/families/celo/RegistrationFlow").then(m => ({ default: m.component })),
});
export const CeloLockFlow = register({
  loader: () => import("~/families/celo/LockFlow").then(m => ({ default: m.component })),
});
export const CeloUnlockFlow = register({
  loader: () => import("~/families/celo/UnlockFlow").then(m => ({ default: m.component })),
});
export const CeloVoteFlow = register({
  loader: () => import("~/families/celo/VoteFlow").then(m => ({ default: m.component })),
});
export const CeloActivateFlow = register({
  loader: () => import("~/families/celo/ActivateFlow").then(m => ({ default: m.component })),
});
export const CeloRevokeFlow = register({
  loader: () => import("~/families/celo/RevokeFlow").then(m => ({ default: m.component })),
});
export const CeloWithdrawFlow = register({
  loader: () => import("~/families/celo/WithdrawFlow").then(m => ({ default: m.component })),
});

export const CosmosDelegationFlow = register({
  loader: () => import("~/families/cosmos/DelegationFlow").then(m => ({ default: m.component })),
});
export const CosmosRedelegationFlow = register({
  loader: () => import("~/families/cosmos/RedelegationFlow").then(m => ({ default: m.component })),
});
export const CosmosUndelegationFlow = register({
  loader: () => import("~/families/cosmos/UndelegationFlow").then(m => ({ default: m.component })),
});
export const CosmosClaimRewardsFlow = register({
  loader: () => import("~/families/cosmos/ClaimRewardsFlow").then(m => ({ default: m.component })),
});
export const CosmosFamilyEditMemo = register({
  loader: () => import("~/families/cosmos/EditMemo").then(m => ({ default: m.component })),
});

export const MultiversXClaimRewardsFlow = register({
  loader: () =>
    import("~/families/multiversx/components/Flows/Claim").then(m => ({ default: m.component })),
});
export const MultiversXDelegationFlow = register({
  loader: () =>
    import("~/families/multiversx/components/Flows/Delegate").then(m => ({ default: m.component })),
});
export const MultiversXUndelegationFlow = register({
  loader: () =>
    import("~/families/multiversx/components/Flows/Undelegate").then(m => ({
      default: m.component,
    })),
});
export const MultiversXWithdrawFlow = register({
  loader: () =>
    import("~/families/multiversx/components/Flows/Withdraw").then(m => ({ default: m.component })),
});

export const EvmEditGasLimit = register({
  loader: () => import("~/families/evm/ScreenEditGasLimit").then(m => ({ default: m.component })),
});
export const EvmCustomFees = register({
  loader: () => import("~/families/evm/EvmCustomFees").then(m => ({ default: m.component })),
});

export const HederaEditMemo = register({
  loader: () => import("~/families/hedera/EditMemo").then(m => ({ default: m.component })),
});
export const HederaAssociateTokenFlow = register({
  loader: () =>
    import("~/families/hedera/AssociateTokenFlow").then(m => ({ default: m.component })),
});

export const InternetComputerEditMemo = register({
  loader: () =>
    import("~/families/internet_computer/ScreenEditMemo").then(m => ({ default: m.component })),
});

export const KaspaEditCustomFees = register({
  loader: () =>
    import("~/families/kaspa/ScreenEditCustomFees").then(m => ({ default: m.component })),
});

export const MinaEditMemo = register({
  loader: () => import("~/families/mina/ScreenEditMemo").then(m => ({ default: m.component })),
});

export const NearStakingFlow = register({
  loader: () => import("~/families/near/StakingFlow").then(m => ({ default: m.component })),
});
export const NearUnstakingFlow = register({
  loader: () => import("~/families/near/UnstakingFlow").then(m => ({ default: m.component })),
});
export const NearWithdrawingFlow = register({
  loader: () => import("~/families/near/WithdrawingFlow").then(m => ({ default: m.component })),
});

export const PolkadotBondFlow = register({
  loader: () => import("~/families/polkadot/BondFlow").then(m => ({ default: m.component })),
});
export const PolkadotRebondFlow = register({
  loader: () => import("~/families/polkadot/RebondFlow").then(m => ({ default: m.component })),
});
export const PolkadotUnbondFlow = register({
  loader: () => import("~/families/polkadot/UnbondFlow").then(m => ({ default: m.component })),
});
export const PolkadotNominateFlow = register({
  loader: () => import("~/families/polkadot/NominateFlow").then(m => ({ default: m.component })),
});
export const PolkadotSimpleOperationFlow = register({
  loader: () =>
    import("~/families/polkadot/SimpleOperationFlow").then(m => ({ default: m.component })),
});

export const XrpEditTag = register({
  loader: () => import("~/families/xrp/ScreenEditTag").then(m => ({ default: m.component })),
});

export const SolanaEditMemo = register({
  loader: () => import("~/families/solana/ScreenEditMemo").then(m => ({ default: m.component })),
});
export const SolanaDelegationFlow = register({
  loader: () => import("~/families/solana/DelegationFlow").then(m => ({ default: m.component })),
});

export const StacksEditMemo = register({
  loader: () => import("~/families/stacks/ScreenEditMemo").then(m => ({ default: m.component })),
});

export const CasperEditTransferId = register({
  loader: () =>
    import("~/families/casper/ScreenEditTransferId").then(m => ({ default: m.component })),
});

export const StellarEditMemoValue = register({
  loader: () =>
    import("~/families/stellar/ScreenEditMemoValue").then(m => ({ default: m.component })),
});
export const StellarEditMemoType = register({
  loader: () =>
    import("~/families/stellar/ScreenEditMemoType").then(m => ({ default: m.component })),
});
export const StellarEditCustomFees = register({
  loader: () =>
    import("~/families/stellar/ScreenEditCustomFees").then(m => ({ default: m.component })),
});
export const StellarAddAssetFlow = register({
  loader: () => import("~/families/stellar/AddAssetFlow").then(m => ({ default: m.component })),
});

export const TezosDelegationFlow = register({
  loader: () => import("~/families/tezos/DelegationFlow").then(m => ({ default: m.component })),
});

export const TronVoteFlow = register({
  loader: () => import("~/families/tron/VoteFlow").then(m => ({ default: m.component })),
});

export const TonEditComment = register({
  loader: () => import("~/families/ton/ScreenEditComment").then(m => ({ default: m.component })),
});

export const SuiDelegationFlow = register({
  loader: () => import("~/families/sui/StakingFlow").then(m => ({ default: m.component })),
});
export const SuiUndelegateFlow = register({
  loader: () => import("~/families/sui/UnstakingFlow").then(m => ({ default: m.component })),
});

export const CantonOnboard = register({
  loader: () => import("~/families/canton/Onboard/Onboard").then(m => ({ default: m.component })),
});
export const CantonEditMemo = register({
  loader: () => import("~/families/canton/ScreenEditMemo").then(m => ({ default: m.component })),
});
