import React, { use } from "react";

import type { Data as AleoSendData } from "./aleo/modals/send/types";
import type { Data as AleoBondPublicData } from "./aleo/BondPublicFlowModal/Body";
import type { Data as AleoManageData } from "./aleo/ManageModal/ManageModal";
import type { Data as AleoUnbondData } from "./aleo/UnbondFlowModal/Body";
import type { Data as AleoClaimUnbondData } from "./aleo/ClaimUnbondFlowModal/Body";
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
import type { CardanoUndelegateSelfTxInfoModalProps as CardanoUndelegateSelfTxInfoProps } from "./cardano/UndelegateFlowModal/info";
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
import type { Data as EvmRedelegateData } from "./evm/RedelegationFlowModal/Body";
import type { Data as EvmClaimRewardsData } from "./evm/ClaimRewardsFlowModal/Body";
import type { Data as EvmWithdrawData } from "./evm/WithdrawFlowModal/Body";
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
import type { Data as TezosEarningChoiceData } from "./tezos/EarningChoiceModal/Body";
import type { Data as TezosStakeData } from "./tezos/StakeFlowModal/Body";
import type { Data as TezosUnstakeData } from "./tezos/UnstakeFlowModal/Body";
import type { Data as TezosUnstakeRequiredData } from "./tezos/UnstakeRequiredModal";

export type CoinModalsData = {
  MODAL_ALEO_SELF_TRANSFER: AleoSendData;
  MODAL_ALEO_BOND_PUBLIC: AleoBondPublicData;
  MODAL_ALEO_MANAGE: AleoManageData;
  MODAL_ALEO_UNBOND: AleoUnbondData;
  MODAL_ALEO_CLAIM_UNBOND: AleoClaimUnbondData;
  MODAL_ALGORAND_OPT_IN: AlgorandOptInData;
  MODAL_ALGORAND_CLAIM_REWARDS: AlgorandClaimRewardsData;
  MODAL_ALGORAND_EARN_REWARDS_INFO: AlgorandEarnRewardsInfoProps;
  MODAL_APTOS_STAKE: AptosStakeData;
  MODAL_APTOS_REWARDS_INFO: AptosRewardsInfoProps;
  MODAL_APTOS_UNSTAKE: AptosUnstakeData;
  MODAL_APTOS_WITHDRAW: AptosWithdrawData;
  MODAL_APTOS_RESTAKE: AptosRestakeData;
  MODAL_ZCASH_EXPORT_KEY: BitcoinZcashExportKeyData;
  MODAL_BITCOIN_EDIT_TRANSACTION: BitcoinEditTransactionProps;
  MODAL_CANTON_ONBOARD_ACCOUNT: CantonOnboardProps;
  MODAL_CANTON_TOO_MANY_UTXOS: CantonTooManyUtxosProps;
  MODAL_CANTON_TERMS: undefined;
  MODAL_CARDANO_DELEGATE: CardanoDelegateProps;
  MODAL_CARDANO_UNDELEGATE: CardanoUndelegateProps;
  MODAL_CARDANO_REWARDS_INFO: CardanoRewardsInfoProps;
  MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO: CardanoUndelegateSelfTxInfoProps;
  MODAL_CELO_REWARDS_INFO: CeloRewardsInfoProps;
  MODAL_CELO_MANAGE: CeloManageProps;
  MODAL_CELO_LOCK: CeloLockData;
  MODAL_CELO_UNLOCK: CeloUnlockData;
  MODAL_CELO_VOTE: CeloVoteData;
  MODAL_CELO_SIMPLE_OPERATION: CeloSimpleOperationData;
  MODAL_CELO_WITHDRAW: CeloWithdrawData;
  MODAL_CELO_ACTIVATE: CeloActivateData;
  MODAL_CELO_REVOKE: CeloRevokeData;
  MODAL_CONCORDIUM_ONBOARD_ACCOUNT: ConcordiumOnboardProps;
  MODAL_COSMOS_DELEGATE: CosmosDelegateData;
  MODAL_COSMOS_REWARDS_INFO: CosmosRewardsInfoProps;
  MODAL_COSMOS_CLAIM_REWARDS: CosmosClaimRewardsData;
  MODAL_COSMOS_REDELEGATE: CosmosRedelegateData;
  MODAL_COSMOS_UNDELEGATE: CosmosUndelegateData;
  MODAL_EVM_STAKE: EvmStakeProps & { singleProviderRedirectMode?: boolean };
  MODAL_EVM_EDIT_TRANSACTION: EvmEditTransactionProps;
  MODAL_EVM_DELEGATE: EvmDelegateData;
  MODAL_EVM_REWARDS_INFO: EvmRewardsInfoProps;
  MODAL_EVM_UNDELEGATE: EvmUndelegateData;
  MODAL_EVM_REDELEGATE: EvmRedelegateData;
  MODAL_EVM_WITHDRAW: EvmWithdrawData;
  MODAL_EVM_CLAIM_REWARDS: EvmClaimRewardsData;
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: HederaReceiveWithAssociationData;
  MODAL_HEDERA_DELEGATION: HederaDelegationData;
  MODAL_HEDERA_UNDELEGATION: HederaUndelegationData;
  MODAL_HEDERA_REDELEGATION: HederaRedelegationData;
  MODAL_HEDERA_CLAIM_REWARDS: HederaClaimRewardsData;
  MODAL_MULTIVERSX_DELEGATE: MultiversxDelegateData;
  MODAL_MULTIVERSX_REWARDS_INFO: MultiversxRewardsInfoProps;
  MODAL_MULTIVERSX_UNDELEGATE: MultiversxUndelegateData;
  MODAL_MULTIVERSX_CLAIM_REWARDS: MultiversxClaimRewardsData;
  MODAL_MULTIVERSX_WITHDRAW: MultiversxWithdrawData;
  MODAL_NEAR_STAKE: NearStakeData;
  MODAL_NEAR_REWARDS_INFO: NearRewardsInfoProps;
  MODAL_NEAR_UNSTAKE: NearUnstakeData;
  MODAL_NEAR_WITHDRAW: NearWithdrawData;
  MODAL_POLKADOT_MANAGE: PolkadotManageProps;
  MODAL_POLKADOT_REWARDS_INFO: PolkadotRewardsInfoProps;
  MODAL_POLKADOT_SIMPLE_OPERATION: PolkadotSimpleOperationData;
  MODAL_POLKADOT_NOMINATE: PolkadotNominateData;
  MODAL_POLKADOT_BOND: PolkadotBondData;
  MODAL_POLKADOT_UNBOND: PolkadotUnbondData;
  MODAL_POLKADOT_REBOND: PolkadotRebondData;
  MODAL_SOLANA_REWARDS_INFO: SolanaRewardsInfoProps;
  MODAL_SOLANA_DELEGATE: SolanaDelegateData;
  MODAL_SOLANA_DELEGATION_ACTIVATE: SolanaDelegationActivateData;
  MODAL_SOLANA_DELEGATION_DEACTIVATE: SolanaDelegationDeactivateData;
  MODAL_SOLANA_DELEGATION_REACTIVATE: SolanaDelegationReactivateData;
  MODAL_SOLANA_DELEGATION_WITHDRAW: SolanaDelegationWithdrawData;
  MODAL_STELLAR_ADD_ASSET: StellarAddAssetData;
  MODAL_SUI_DELEGATE: SuiDelegateData;
  MODAL_SUI_UNSTAKE: SuiUnstakeData;
  MODAL_DELEGATE: TezosDelegateData;
  MODAL_TEZOS_EARNING_CHOICE: TezosEarningChoiceData;
  MODAL_TEZOS_STAKE: TezosStakeData;
  MODAL_TEZOS_UNSTAKE: TezosUnstakeData;
  MODAL_TEZOS_UNSTAKE_REQUIRED: TezosUnstakeRequiredData;
};

export type CoinModalKey = keyof CoinModalsData;

// oxlint-disable-next-line typescript/no-explicit-any
type CoinModalImport = () => Promise<{ default: React.ComponentType<any> }>;

// Raw import() per modal, kept separate from coinModalLoaders so chunks can be warmed via
// preloadCoinModals() (the bundler dedupes, so React.lazy then resolves instantly).
export const coinModalImports: Record<CoinModalKey, CoinModalImport> = {
  MODAL_ALEO_SELF_TRANSFER: () => import("./aleo/SelfTransferModal"),
  MODAL_ALEO_BOND_PUBLIC: () => import("./aleo/BondPublicFlowModal"),
  MODAL_ALEO_MANAGE: () => import("./aleo/ManageModal/ManageModal"),
  MODAL_ALEO_UNBOND: () => import("./aleo/UnbondFlowModal"),
  MODAL_ALEO_CLAIM_UNBOND: () => import("./aleo/ClaimUnbondFlowModal"),
  MODAL_ALGORAND_OPT_IN: () => import("./algorand/OptInFlowModal"),
  MODAL_ALGORAND_CLAIM_REWARDS: () => import("./algorand/Rewards/ClaimRewardsFlowModal"),
  MODAL_ALGORAND_EARN_REWARDS_INFO: () => import("./algorand/Rewards/EarnRewardsInfoModal"),
  MODAL_APTOS_STAKE: () => import("./aptos/StakingFlowModal"),
  MODAL_APTOS_REWARDS_INFO: () => import("./aptos/StakingFlowModal/Info"),
  MODAL_APTOS_UNSTAKE: () => import("./aptos/UnstakingFlowModal"),
  MODAL_APTOS_WITHDRAW: () => import("./aptos/WithdrawingFlowModal"),
  MODAL_APTOS_RESTAKE: () => import("./aptos/RestakingFlowModal"),
  MODAL_ZCASH_EXPORT_KEY: () => import("./bitcoin/ZCashExportKeyFlowModal"),
  MODAL_BITCOIN_EDIT_TRANSACTION: () =>
    import("./bitcoin/EditTransaction/Modal").then(m => ({ default: m.EditTransactionModal })),
  MODAL_CANTON_ONBOARD_ACCOUNT: () => import("./canton/OnboardModal"),
  MODAL_CANTON_TOO_MANY_UTXOS: () => import("./canton/TooManyUtxosModal"),
  MODAL_CANTON_TERMS: () => import("./canton/CantonTermsModal"),
  MODAL_CARDANO_DELEGATE: () => import("./cardano/DelegationFlowModal"),
  MODAL_CARDANO_UNDELEGATE: () => import("./cardano/UndelegateFlowModal"),
  MODAL_CARDANO_REWARDS_INFO: () => import("./cardano/DelegationFlowModal/Info"),
  MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO: () => import("./cardano/UndelegateFlowModal/info"),
  MODAL_CELO_REWARDS_INFO: () => import("./celo/EarnRewardsInfoModal/EarnRewardsInfoModal"),
  MODAL_CELO_MANAGE: () => import("./celo/ManageModal/ManageModal"),
  MODAL_CELO_LOCK: () => import("./celo/LockFlowModal"),
  MODAL_CELO_UNLOCK: () => import("./celo/UnlockFlowModal"),
  MODAL_CELO_VOTE: () => import("./celo/VoteFlowModal"),
  MODAL_CELO_SIMPLE_OPERATION: () =>
    import("./celo/SimpleOperationFlowModal/SimpleOperationFlowModal"),
  MODAL_CELO_WITHDRAW: () => import("./celo/WithdrawFlowModal"),
  MODAL_CELO_ACTIVATE: () => import("./celo/ActivateFlowModal"),
  MODAL_CELO_REVOKE: () => import("./celo/RevokeFlowModal"),
  MODAL_CONCORDIUM_ONBOARD_ACCOUNT: () => import("./concordium/OnboardModal"),
  MODAL_COSMOS_DELEGATE: () => import("./cosmos/DelegationFlowModal"),
  MODAL_COSMOS_REWARDS_INFO: () => import("./cosmos/DelegationFlowModal/Info"),
  MODAL_COSMOS_CLAIM_REWARDS: () => import("./cosmos/ClaimRewardsFlowModal"),
  MODAL_COSMOS_REDELEGATE: () => import("./cosmos/RedelegationFlowModal"),
  MODAL_COSMOS_UNDELEGATE: () => import("./cosmos/UndelegationFlowModal"),
  MODAL_EVM_STAKE: () => import("./evm/StakeFlowModal"),
  MODAL_EVM_EDIT_TRANSACTION: () =>
    import("./evm/EditTransaction/Modal").then(m => ({ default: m.EditTransactionModal })),
  MODAL_EVM_DELEGATE: () => import("./evm/DelegationFlowModal"),
  MODAL_EVM_REWARDS_INFO: () => import("./evm/DelegationFlowModal/Info"),
  MODAL_EVM_UNDELEGATE: () => import("./evm/UndelegationFlowModal"),
  MODAL_EVM_REDELEGATE: () => import("./evm/RedelegationFlowModal"),
  MODAL_EVM_WITHDRAW: () => import("./evm/WithdrawFlowModal"),
  MODAL_EVM_CLAIM_REWARDS: () => import("./evm/ClaimRewardsFlowModal"),
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: () => import("./hedera/ReceiveWithAssociationModal"),
  MODAL_HEDERA_DELEGATION: () => import("./hedera/DelegationFlowModal"),
  MODAL_HEDERA_UNDELEGATION: () => import("./hedera/UndelegationFlowModal"),
  MODAL_HEDERA_REDELEGATION: () => import("./hedera/RedelegationFlowModal"),
  MODAL_HEDERA_CLAIM_REWARDS: () => import("./hedera/ClaimRewardsFlowModal"),
  MODAL_MULTIVERSX_DELEGATE: () => import("./multiversx/components/Modals/Delegate"),
  MODAL_MULTIVERSX_REWARDS_INFO: () => import("./multiversx/components/Modals/Delegate/Info"),
  MODAL_MULTIVERSX_UNDELEGATE: () => import("./multiversx/components/Modals/Undelegate"),
  MODAL_MULTIVERSX_CLAIM_REWARDS: () => import("./multiversx/components/Modals/Claim"),
  MODAL_MULTIVERSX_WITHDRAW: () => import("./multiversx/components/Modals/Withdraw"),
  MODAL_NEAR_STAKE: () => import("./near/StakingFlowModal"),
  MODAL_NEAR_REWARDS_INFO: () => import("./near/StakingFlowModal/Info"),
  MODAL_NEAR_UNSTAKE: () => import("./near/UnstakingFlowModal"),
  MODAL_NEAR_WITHDRAW: () => import("./near/WithdrawingFlowModal"),
  MODAL_POLKADOT_MANAGE: () => import("./polkadot/ManageModal"),
  MODAL_POLKADOT_REWARDS_INFO: () => import("./polkadot/EarnRewardsInfoModal"),
  MODAL_POLKADOT_SIMPLE_OPERATION: () => import("./polkadot/SimpleOperationFlowModal"),
  MODAL_POLKADOT_NOMINATE: () => import("./polkadot/NominationFlowModal"),
  MODAL_POLKADOT_BOND: () => import("./polkadot/BondFlowModal"),
  MODAL_POLKADOT_UNBOND: () => import("./polkadot/UnbondFlowModal"),
  MODAL_POLKADOT_REBOND: () => import("./polkadot/RebondFlowModal"),
  MODAL_SOLANA_REWARDS_INFO: () => import("./solana/DelegationFlowModal/Info"),
  MODAL_SOLANA_DELEGATE: () => import("./solana/DelegationFlowModal"),
  MODAL_SOLANA_DELEGATION_ACTIVATE: () => import("./solana/DelegationActivateFlowModal"),
  MODAL_SOLANA_DELEGATION_DEACTIVATE: () => import("./solana/DelegationDeactivateFlowModal"),
  MODAL_SOLANA_DELEGATION_REACTIVATE: () => import("./solana/DelegationReactivateFlowModal"),
  MODAL_SOLANA_DELEGATION_WITHDRAW: () => import("./solana/DelegationWithdrawFlowModal"),
  MODAL_STELLAR_ADD_ASSET: () => import("./stellar/AddAssetModal"),
  MODAL_SUI_DELEGATE: () => import("./sui/DelegationFlowModal"),
  MODAL_SUI_UNSTAKE: () => import("./sui/UnstakingFlowModal"),
  MODAL_DELEGATE: () => import("./tezos/DelegateFlowModal"),
  MODAL_TEZOS_EARNING_CHOICE: () => import("./tezos/EarningChoiceModal"),
  MODAL_TEZOS_STAKE: () => import("./tezos/StakeFlowModal"),
  MODAL_TEZOS_UNSTAKE: () => import("./tezos/UnstakeFlowModal"),
  MODAL_TEZOS_UNSTAKE_REQUIRED: () => import("./tezos/UnstakeRequiredModal"),
};

// oxlint-disable-next-line typescript/no-explicit-any
type CoinModalComponent = React.ComponentType<any>;

// Attach React use() hint fields so a settled promise resolves synchronously (no Suspense flash).
function annotate(p: Promise<CoinModalComponent>): Promise<CoinModalComponent> {
  p.then(
    value => Object.assign(p, { status: "fulfilled", value }),
    reason => Object.assign(p, { status: "rejected", reason }),
  );
  return p;
}

// Cached, annotated import promise per modal — shared between preload and render so a preloaded
// modal is already settled by the time it renders. Mirrors the family cache in registry.ts.
const modalPromiseCache: Partial<Record<CoinModalKey, Promise<CoinModalComponent>>> = {};
function loadCoinModal(key: CoinModalKey): Promise<CoinModalComponent> {
  return (modalPromiseCache[key] ??= annotate(coinModalImports[key]().then(m => m.default)));
}

// Warm (cache + annotate) the given modal chunks so opening them later renders synchronously.
// Drop the cache entry on failure so a transient preload error doesn't poison a later render:
// modals have no retry wrapper, so a cached rejection would make use() throw instead of refetching.
export function preloadCoinModals(names: readonly CoinModalKey[]): void {
  for (const name of names)
    loadCoinModal(name).catch(() => {
      delete modalPromiseCache[name];
    });
}

// One wrapper per modal: use() the cached promise so a preloaded modal renders with no suspend
// (no flash); a cold modal suspends until its chunk loads. Requires a <Suspense> boundary above.
export const coinModalLoaders: Record<CoinModalKey, CoinModalComponent> = Object.fromEntries(
  (Object.keys(coinModalImports) as CoinModalKey[]).map(key => {
    const CoinModal = (props: Record<string, unknown>) =>
      React.createElement(use(loadCoinModal(key)), props);
    CoinModal.displayName = `CoinModal(${key})`;
    return [key, CoinModal];
  }),
) as Record<CoinModalKey, CoinModalComponent>;
