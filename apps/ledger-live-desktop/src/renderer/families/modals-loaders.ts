import React from "react";

import type { Data as AleoSendData } from "./aleo/modals/send/types";
import type { Data as AlgorandOptInData } from "./algorand/OptInFlowModal/Body";
import type { Data as AlgorandClaimRewardsData } from "./algorand/Rewards/ClaimRewardsFlowModal/Body";
import type { Props as AlgorandEarnRewardsInfoProps } from "./algorand/Rewards/EarnRewardsInfoModal";
import type { Data as AptosStakeData } from "./aptos/StakingFlowModal/Body";
import type { Props as AptosRewardsInfoProps } from "./aptos/StakingFlowModal/Info";
import type { Data as AptosUnstakeData } from "./aptos/UnstakingFlowModal/Body";
import type { Data as AptosWithdrawData } from "./aptos/WithdrawingFlowModal/Body";
import type { Data as AptosRestakeData } from "./aptos/RestakingFlowModal/Body";
import type { Data as BitcoinZcashExportKeyData } from "./bitcoin/ZCashExportKeyFlowModal/Body";
import type { EditTransactionModalProps as BitcoinEditTransactionProps } from "./bitcoin/EditTransaction/Modal";
import type { UserProps as CantonOnboardProps } from "./canton/OnboardModal";
import type { Props as CantonTooManyUtxosProps } from "./canton/TooManyUtxosModal";
import type { DelegationModalProps as CardanoDelegateProps } from "./cardano/DelegationFlowModal";
import type { UnDelegationModalProps as CardanoUndelegateProps } from "./cardano/UndelegateFlowModal";
import type { CardanoEarnRewardsInfoModalProps as CardanoRewardsInfoProps } from "./cardano/DelegationFlowModal/Info";
import type { Props as CeloRewardsInfoProps } from "./celo/EarnRewardsInfoModal/EarnRewardsInfoModal";
import type { Props as CeloManageProps } from "./celo/ManageModal/ManageModal";
import type { Data as CeloLockData } from "./celo/LockFlowModal/Body";
import type { Data as CeloUnlockData } from "./celo/UnlockFlowModal/Body";
import type { Data as CeloVoteData } from "./celo/VoteFlowModal/Body";
import type { Data as CeloSimpleOperationData } from "./celo/SimpleOperationFlowModal/Body";
import type { Data as CeloWithdrawData } from "./celo/WithdrawFlowModal/Body";
import type { Data as CeloActivateData } from "./celo/ActivateFlowModal/Body";
import type { Data as CeloRevokeData } from "./celo/RevokeFlowModal/Body";
import type { UserProps as ConcordiumOnboardProps } from "./concordium/OnboardModal";
import type { Data as CosmosDelegateData } from "./cosmos/DelegationFlowModal/Body";
import type { Props as CosmosRewardsInfoProps } from "./cosmos/DelegationFlowModal/Info";
import type { Data as CosmosClaimRewardsData } from "./cosmos/ClaimRewardsFlowModal/Body";
import type { Data as CosmosRedelegateData } from "./cosmos/RedelegationFlowModal/Body";
import type { Data as CosmosUndelegateData } from "./cosmos/UndelegationFlowModal/Body";
import type { Props as EvmStakeProps } from "./evm/StakeFlowModal";
import type { EditTransactionModalProps as EvmEditTransactionProps } from "./evm/EditTransaction/Modal";
import type { Data as EvmDelegateData } from "./evm/DelegationFlowModal/Body";
import type { Props as EvmRewardsInfoProps } from "./evm/DelegationFlowModal/Info";
import type { Data as EvmUndelegateData } from "./evm/UndelegationFlowModal/Body";
import type { Data as HederaReceiveWithAssociationData } from "./hedera/ReceiveWithAssociationModal/types";
import type { Data as HederaDelegationData } from "./hedera/DelegationFlowModal/Body";
import type { Data as HederaUndelegationData } from "./hedera/UndelegationFlowModal/Body";
import type { Data as HederaRedelegationData } from "./hedera/RedelegationFlowModal/Body";
import type { Data as HederaClaimRewardsData } from "./hedera/ClaimRewardsFlowModal/Body";
import type { Data as MultiversxDelegateData } from "./multiversx/components/Modals/Delegate/Body";
import type { Props as MultiversxRewardsInfoProps } from "./multiversx/components/Modals/Delegate/Info";
import type { Data as MultiversxUndelegateData } from "./multiversx/components/Modals/Undelegate/Body";
import type { Data as MultiversxClaimRewardsData } from "./multiversx/components/Modals/Claim/Body";
import type { Data as MultiversxWithdrawData } from "./multiversx/components/Modals/Withdraw/Body";
import type { Data as NearStakeData } from "./near/StakingFlowModal/Body";
import type { Props as NearRewardsInfoProps } from "./near/StakingFlowModal/Info";
import type { Data as NearUnstakeData } from "./near/UnstakingFlowModal/Body";
import type { Data as NearWithdrawData } from "./near/WithdrawingFlowModal/Body";
import type { Props as PolkadotManageProps } from "./polkadot/ManageModal";
import type { Props as PolkadotRewardsInfoProps } from "./polkadot/EarnRewardsInfoModal";
import type { Data as PolkadotSimpleOperationData } from "./polkadot/SimpleOperationFlowModal/Body";
import type { Data as PolkadotNominateData } from "./polkadot/NominationFlowModal/Body";
import type { Data as PolkadotBondData } from "./polkadot/BondFlowModal/Body";
import type { Data as PolkadotUnbondData } from "./polkadot/UnbondFlowModal/Body";
import type { Data as PolkadotRebondData } from "./polkadot/RebondFlowModal/Body";
import type { Props as SolanaRewardsInfoProps } from "./solana/DelegationFlowModal/Info";
import type { Data as SolanaDelegateData } from "./solana/DelegationFlowModal/Body";
import type { Data as SolanaDelegationActivateData } from "./solana/DelegationActivateFlowModal/Body";
import type { Data as SolanaDelegationDeactivateData } from "./solana/DelegationDeactivateFlowModal/Body";
import type { Data as SolanaDelegationReactivateData } from "./solana/DelegationReactivateFlowModal/Body";
import type { Data as SolanaDelegationWithdrawData } from "./solana/DelegationWithdrawFlowModal/Body";
import type { Data as StellarAddAssetData } from "./stellar/AddAssetModal/Body";
import type { Data as SuiDelegateData } from "./sui/DelegationFlowModal/Body";
import type { Data as SuiUnstakeData } from "./sui/UnstakingFlowModal/Body";
import type { Data as TezosDelegateData } from "./tezos/DelegateFlowModal/Body";

/**
 * Props-type map for all coin-family modals.
 * Hand-maintained replacement for the old generated CoinModalsData type.
 * Hand-maintained: add/remove entries here when adding/removing coin modals.
 */
export type CoinModalsData = {
  // aleo
  MODAL_ALEO_SELF_TRANSFER: AleoSendData;
  // algorand
  MODAL_ALGORAND_OPT_IN: AlgorandOptInData;
  MODAL_ALGORAND_CLAIM_REWARDS: AlgorandClaimRewardsData;
  MODAL_ALGORAND_EARN_REWARDS_INFO: AlgorandEarnRewardsInfoProps;
  // aptos
  MODAL_APTOS_STAKE: AptosStakeData;
  MODAL_APTOS_REWARDS_INFO: AptosRewardsInfoProps;
  MODAL_APTOS_UNSTAKE: AptosUnstakeData;
  MODAL_APTOS_WITHDRAW: AptosWithdrawData;
  MODAL_APTOS_RESTAKE: AptosRestakeData;
  // bitcoin
  MODAL_ZCASH_EXPORT_KEY: BitcoinZcashExportKeyData;
  MODAL_BITCOIN_EDIT_TRANSACTION: BitcoinEditTransactionProps;
  // canton
  MODAL_CANTON_ONBOARD_ACCOUNT: CantonOnboardProps;
  MODAL_CANTON_TOO_MANY_UTXOS: CantonTooManyUtxosProps;
  // cardano
  MODAL_CARDANO_DELEGATE: CardanoDelegateProps;
  MODAL_CARDANO_UNDELEGATE: CardanoUndelegateProps;
  MODAL_CARDANO_REWARDS_INFO: CardanoRewardsInfoProps;
  // celo
  MODAL_CELO_REWARDS_INFO: CeloRewardsInfoProps;
  MODAL_CELO_MANAGE: CeloManageProps;
  MODAL_CELO_LOCK: CeloLockData;
  MODAL_CELO_UNLOCK: CeloUnlockData;
  MODAL_CELO_VOTE: CeloVoteData;
  MODAL_CELO_SIMPLE_OPERATION: CeloSimpleOperationData;
  MODAL_CELO_WITHDRAW: CeloWithdrawData;
  MODAL_CELO_ACTIVATE: CeloActivateData;
  MODAL_CELO_REVOKE: CeloRevokeData;
  // concordium
  MODAL_CONCORDIUM_ONBOARD_ACCOUNT: ConcordiumOnboardProps;
  // cosmos
  MODAL_COSMOS_DELEGATE: CosmosDelegateData;
  MODAL_COSMOS_REWARDS_INFO: CosmosRewardsInfoProps;
  MODAL_COSMOS_CLAIM_REWARDS: CosmosClaimRewardsData;
  MODAL_COSMOS_REDELEGATE: CosmosRedelegateData;
  MODAL_COSMOS_UNDELEGATE: CosmosUndelegateData;
  // evm
  MODAL_EVM_STAKE: EvmStakeProps & { singleProviderRedirectMode?: boolean };
  MODAL_EVM_EDIT_TRANSACTION: EvmEditTransactionProps;
  MODAL_EVM_DELEGATE: EvmDelegateData;
  MODAL_EVM_REWARDS_INFO: EvmRewardsInfoProps;
  MODAL_EVM_UNDELEGATE: EvmUndelegateData;
  // hedera
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: HederaReceiveWithAssociationData;
  MODAL_HEDERA_DELEGATION: HederaDelegationData;
  MODAL_HEDERA_UNDELEGATION: HederaUndelegationData;
  MODAL_HEDERA_REDELEGATION: HederaRedelegationData;
  MODAL_HEDERA_CLAIM_REWARDS: HederaClaimRewardsData;
  // multiversx
  MODAL_MULTIVERSX_DELEGATE: MultiversxDelegateData;
  MODAL_MULTIVERSX_REWARDS_INFO: MultiversxRewardsInfoProps;
  MODAL_MULTIVERSX_UNDELEGATE: MultiversxUndelegateData;
  MODAL_MULTIVERSX_CLAIM_REWARDS: MultiversxClaimRewardsData;
  MODAL_MULTIVERSX_WITHDRAW: MultiversxWithdrawData;
  // near
  MODAL_NEAR_STAKE: NearStakeData;
  MODAL_NEAR_REWARDS_INFO: NearRewardsInfoProps;
  MODAL_NEAR_UNSTAKE: NearUnstakeData;
  MODAL_NEAR_WITHDRAW: NearWithdrawData;
  // polkadot
  MODAL_POLKADOT_MANAGE: PolkadotManageProps;
  MODAL_POLKADOT_REWARDS_INFO: PolkadotRewardsInfoProps;
  MODAL_POLKADOT_SIMPLE_OPERATION: PolkadotSimpleOperationData;
  MODAL_POLKADOT_NOMINATE: PolkadotNominateData;
  MODAL_POLKADOT_BOND: PolkadotBondData;
  MODAL_POLKADOT_UNBOND: PolkadotUnbondData;
  MODAL_POLKADOT_REBOND: PolkadotRebondData;
  // solana
  MODAL_SOLANA_REWARDS_INFO: SolanaRewardsInfoProps;
  MODAL_SOLANA_DELEGATE: SolanaDelegateData;
  MODAL_SOLANA_DELEGATION_ACTIVATE: SolanaDelegationActivateData;
  MODAL_SOLANA_DELEGATION_DEACTIVATE: SolanaDelegationDeactivateData;
  MODAL_SOLANA_DELEGATION_REACTIVATE: SolanaDelegationReactivateData;
  MODAL_SOLANA_DELEGATION_WITHDRAW: SolanaDelegationWithdrawData;
  // stellar
  MODAL_STELLAR_ADD_ASSET: StellarAddAssetData;
  // sui
  MODAL_SUI_DELEGATE: SuiDelegateData;
  MODAL_SUI_UNSTAKE: SuiUnstakeData;
  // tezos
  MODAL_DELEGATE: TezosDelegateData;
};

/**
 * Coin-family modal loaders using React.lazy().
 * React.lazy() does NOT trigger import() until the component first renders inside <Suspense>.
 * This means loading this module at startup has zero cost.
 *
 * Replaces the 18 per-family modals.ts barrel files.
 * Hand-maintained: one entry per coin modal. Add/remove entries here when adding/removing coin modals.
 */
export const coinModalLoaders: Record<
  string,
  // oxlint-disable-next-line typescript/no-explicit-any
  React.LazyExoticComponent<React.ComponentType<any>>
> =
  {
    // aleo
    MODAL_ALEO_SELF_TRANSFER: React.lazy(() => import("./aleo/SelfTransferModal")),
    // algorand
    MODAL_ALGORAND_OPT_IN: React.lazy(() => import("./algorand/OptInFlowModal")),
    MODAL_ALGORAND_CLAIM_REWARDS: React.lazy(() => import("./algorand/Rewards/ClaimRewardsFlowModal")),
    MODAL_ALGORAND_EARN_REWARDS_INFO: React.lazy(() => import("./algorand/Rewards/EarnRewardsInfoModal")),
    // aptos
    MODAL_APTOS_STAKE: React.lazy(() => import("./aptos/StakingFlowModal")),
    MODAL_APTOS_REWARDS_INFO: React.lazy(() => import("./aptos/StakingFlowModal/Info")),
    MODAL_APTOS_UNSTAKE: React.lazy(() => import("./aptos/UnstakingFlowModal")),
    MODAL_APTOS_WITHDRAW: React.lazy(() => import("./aptos/WithdrawingFlowModal")),
    MODAL_APTOS_RESTAKE: React.lazy(() => import("./aptos/RestakingFlowModal")),
    // bitcoin
    MODAL_ZCASH_EXPORT_KEY: React.lazy(() => import("./bitcoin/ZCashExportKeyFlowModal")),
    MODAL_BITCOIN_EDIT_TRANSACTION: React.lazy(() =>
      import("./bitcoin/EditTransaction/Modal").then(m => ({ default: m.EditTransactionModal })),
    ),
    // canton
    MODAL_CANTON_ONBOARD_ACCOUNT: React.lazy(() => import("./canton/OnboardModal")),
    MODAL_CANTON_TOO_MANY_UTXOS: React.lazy(() => import("./canton/TooManyUtxosModal")),
    // cardano
    MODAL_CARDANO_DELEGATE: React.lazy(() => import("./cardano/DelegationFlowModal")),
    MODAL_CARDANO_UNDELEGATE: React.lazy(() => import("./cardano/UndelegateFlowModal")),
    MODAL_CARDANO_REWARDS_INFO: React.lazy(() => import("./cardano/DelegationFlowModal/Info")),
    // celo
    MODAL_CELO_REWARDS_INFO: React.lazy(
      () => import("./celo/EarnRewardsInfoModal/EarnRewardsInfoModal"),
    ),
    MODAL_CELO_MANAGE: React.lazy(() => import("./celo/ManageModal/ManageModal")),
    MODAL_CELO_LOCK: React.lazy(() => import("./celo/LockFlowModal")),
    MODAL_CELO_UNLOCK: React.lazy(() => import("./celo/UnlockFlowModal")),
    MODAL_CELO_VOTE: React.lazy(() => import("./celo/VoteFlowModal")),
    MODAL_CELO_SIMPLE_OPERATION: React.lazy(
      () => import("./celo/SimpleOperationFlowModal/SimpleOperationFlowModal"),
    ),
    MODAL_CELO_WITHDRAW: React.lazy(() => import("./celo/WithdrawFlowModal")),
    MODAL_CELO_ACTIVATE: React.lazy(() => import("./celo/ActivateFlowModal")),
    MODAL_CELO_REVOKE: React.lazy(() => import("./celo/RevokeFlowModal")),
    // concordium
    MODAL_CONCORDIUM_ONBOARD_ACCOUNT: React.lazy(() => import("./concordium/OnboardModal")),
    // cosmos
    MODAL_COSMOS_DELEGATE: React.lazy(() => import("./cosmos/DelegationFlowModal")),
    MODAL_COSMOS_REWARDS_INFO: React.lazy(() => import("./cosmos/DelegationFlowModal/Info")),
    MODAL_COSMOS_CLAIM_REWARDS: React.lazy(() => import("./cosmos/ClaimRewardsFlowModal")),
    MODAL_COSMOS_REDELEGATE: React.lazy(() => import("./cosmos/RedelegationFlowModal")),
    MODAL_COSMOS_UNDELEGATE: React.lazy(() => import("./cosmos/UndelegationFlowModal")),
    // evm
    MODAL_EVM_STAKE: React.lazy(() => import("./evm/StakeFlowModal")),
    MODAL_EVM_EDIT_TRANSACTION: React.lazy(() =>
      import("./evm/EditTransaction/Modal").then(m => ({ default: m.EditTransactionModal })),
    ),
    MODAL_EVM_DELEGATE: React.lazy(() => import("./evm/DelegationFlowModal")),
    MODAL_EVM_REWARDS_INFO: React.lazy(() => import("./evm/DelegationFlowModal/Info")),
    MODAL_EVM_UNDELEGATE: React.lazy(() => import("./evm/UndelegationFlowModal")),
    // hedera
    MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: React.lazy(
      () => import("./hedera/ReceiveWithAssociationModal"),
    ),
    MODAL_HEDERA_DELEGATION: React.lazy(() => import("./hedera/DelegationFlowModal")),
    MODAL_HEDERA_UNDELEGATION: React.lazy(() => import("./hedera/UndelegationFlowModal")),
    MODAL_HEDERA_REDELEGATION: React.lazy(() => import("./hedera/RedelegationFlowModal")),
    MODAL_HEDERA_CLAIM_REWARDS: React.lazy(() => import("./hedera/ClaimRewardsFlowModal")),
    // multiversx
    MODAL_MULTIVERSX_DELEGATE: React.lazy(() => import("./multiversx/components/Modals/Delegate")),
    MODAL_MULTIVERSX_REWARDS_INFO: React.lazy(
      () => import("./multiversx/components/Modals/Delegate/Info"),
    ),
    MODAL_MULTIVERSX_UNDELEGATE: React.lazy(
      () => import("./multiversx/components/Modals/Undelegate"),
    ),
    MODAL_MULTIVERSX_CLAIM_REWARDS: React.lazy(() => import("./multiversx/components/Modals/Claim")),
    MODAL_MULTIVERSX_WITHDRAW: React.lazy(
      () => import("./multiversx/components/Modals/Withdraw"),
    ),
    // near
    MODAL_NEAR_STAKE: React.lazy(() => import("./near/StakingFlowModal")),
    MODAL_NEAR_REWARDS_INFO: React.lazy(() => import("./near/StakingFlowModal/Info")),
    MODAL_NEAR_UNSTAKE: React.lazy(() => import("./near/UnstakingFlowModal")),
    MODAL_NEAR_WITHDRAW: React.lazy(() => import("./near/WithdrawingFlowModal")),
    // polkadot
    MODAL_POLKADOT_MANAGE: React.lazy(() => import("./polkadot/ManageModal")),
    MODAL_POLKADOT_REWARDS_INFO: React.lazy(() => import("./polkadot/EarnRewardsInfoModal")),
    MODAL_POLKADOT_SIMPLE_OPERATION: React.lazy(
      () => import("./polkadot/SimpleOperationFlowModal"),
    ),
    MODAL_POLKADOT_NOMINATE: React.lazy(() => import("./polkadot/NominationFlowModal")),
    MODAL_POLKADOT_BOND: React.lazy(() => import("./polkadot/BondFlowModal")),
    MODAL_POLKADOT_UNBOND: React.lazy(() => import("./polkadot/UnbondFlowModal")),
    MODAL_POLKADOT_REBOND: React.lazy(() => import("./polkadot/RebondFlowModal")),
    // solana
    MODAL_SOLANA_REWARDS_INFO: React.lazy(() => import("./solana/DelegationFlowModal/Info")),
    MODAL_SOLANA_DELEGATE: React.lazy(() => import("./solana/DelegationFlowModal")),
    MODAL_SOLANA_DELEGATION_ACTIVATE: React.lazy(
      () => import("./solana/DelegationActivateFlowModal"),
    ),
    MODAL_SOLANA_DELEGATION_DEACTIVATE: React.lazy(
      () => import("./solana/DelegationDeactivateFlowModal"),
    ),
    MODAL_SOLANA_DELEGATION_REACTIVATE: React.lazy(
      () => import("./solana/DelegationReactivateFlowModal"),
    ),
    MODAL_SOLANA_DELEGATION_WITHDRAW: React.lazy(
      () => import("./solana/DelegationWithdrawFlowModal"),
    ),
    // stellar
    MODAL_STELLAR_ADD_ASSET: React.lazy(() => import("./stellar/AddAssetModal")),
    // sui
    MODAL_SUI_DELEGATE: React.lazy(() => import("./sui/DelegationFlowModal")),
    MODAL_SUI_UNSTAKE: React.lazy(() => import("./sui/UnstakingFlowModal")),
    // tezos
    MODAL_DELEGATE: React.lazy(() => import("./tezos/DelegateFlowModal")),
  };
