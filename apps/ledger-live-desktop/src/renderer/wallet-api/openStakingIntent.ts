import type { Account } from "@ledgerhq/types-live";
import type { StakingIntent, StakingIntentOpenParams } from "@ledgerhq/live-common/wallet-api/StakingIntent/types";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import type { SolanaAccount, SolanaStake, SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import type { NearAccount } from "@ledgerhq/live-common/families/near/types";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import type { SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import type { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import type { StakingAccount } from "@ledgerhq/coin-evm/types/staking";

type OpenModalFn = (name: string, data?: Record<string, unknown>) => void;

type IntentDispatchContext = {
  account: Account;
  params: StakingIntentOpenParams;
  openModal: OpenModalFn;
};

type IntentHandler = (ctx: IntentDispatchContext) => void;

const EARN_SOURCE = "earn";

function findSolanaStake(account: SolanaAccount, validatorAddress?: string): SolanaStake | undefined {
  const stakes = account.solanaResources?.stakes ?? [];
  if (!validatorAddress) return stakes[0];
  return stakes.find(
    s =>
      s.stakeAccAddr === validatorAddress ||
      s.delegation?.voteAccAddr === validatorAddress,
  );
}

function solanaStakeWithMeta(
  account: SolanaAccount,
  validatorAddress?: string,
): SolanaStakeWithMeta | undefined {
  const stake = findSolanaStake(account, validatorAddress);
  if (!stake) return undefined;
  return { stake, meta: {} };
}

const DESKTOP_INTENT_HANDLERS: Record<string, Partial<Record<StakingIntent, IntentHandler>>> = {
  cosmos: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_COSMOS_DELEGATE", {
        account: account as CosmosAccount,
        source: EARN_SOURCE,
      });
    },
    unstake: ({ account, params, openModal }) => {
      openModal("MODAL_COSMOS_UNDELEGATE", {
        account: account as CosmosAccount,
        validatorAddress: params.validatorAddress ?? "",
      });
    },
    restake: ({ account, params, openModal }) => {
      openModal("MODAL_COSMOS_REDELEGATE", {
        account: account as CosmosAccount,
        validatorAddress: params.validatorAddress,
        validatorDstAddress: params.validatorDstAddress,
        source: EARN_SOURCE,
      });
    },
    claimRewards: ({ account, params, openModal }) => {
      openModal("MODAL_COSMOS_CLAIM_REWARDS", {
        account: account as CosmosAccount,
        validatorAddress: params.validatorAddress,
      });
    },
  },
  solana: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_SOLANA_DELEGATE", { account: account as SolanaAccount });
    },
    unstake: ({ account, params, openModal }) => {
      const solanaAccount = account as SolanaAccount;
      const stakeWithMeta = solanaStakeWithMeta(solanaAccount, params.validatorAddress);
      if (stakeWithMeta) {
        openModal("MODAL_SOLANA_DELEGATION_DEACTIVATE", { account: solanaAccount, stakeWithMeta });
      } else {
        openModal("MODAL_SOLANA_DELEGATE", { account: solanaAccount });
      }
    },
    restake: ({ account, params, openModal }) => {
      const solanaAccount = account as SolanaAccount;
      const stakeWithMeta = solanaStakeWithMeta(solanaAccount, params.validatorAddress);
      if (stakeWithMeta) {
        openModal("MODAL_SOLANA_DELEGATION_REACTIVATE", { account: solanaAccount, stakeWithMeta });
      } else {
        openModal("MODAL_SOLANA_DELEGATE", { account: solanaAccount });
      }
    },
    withdraw: ({ account, params, openModal }) => {
      const solanaAccount = account as SolanaAccount;
      const stakeWithMeta = solanaStakeWithMeta(solanaAccount, params.validatorAddress);
      if (stakeWithMeta) {
        openModal("MODAL_SOLANA_DELEGATION_WITHDRAW", { account: solanaAccount, stakeWithMeta });
      } else {
        openModal("MODAL_SOLANA_DELEGATE", { account: solanaAccount });
      }
    },
  },
  tezos: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_TEZOS_STAKE", { account });
    },
    unstake: ({ account, openModal }) => {
      openModal("MODAL_TEZOS_UNSTAKE", { account });
    },
  },
  near: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_NEAR_STAKE", { account: account as NearAccount });
    },
    unstake: ({ account, openModal }) => {
      openModal("MODAL_NEAR_UNSTAKE", { account: account as NearAccount });
    },
    withdraw: ({ account, openModal }) => {
      openModal("MODAL_NEAR_WITHDRAW", { account: account as NearAccount });
    },
  },
  cardano: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_CARDANO_DELEGATE", { account: account as CardanoAccount });
    },
    unstake: ({ account, openModal }) => {
      openModal("MODAL_CARDANO_UNDELEGATE", { account: account as CardanoAccount });
    },
  },
  multiversx: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_MULTIVERSX_DELEGATE", { account: account as MultiversXAccount });
    },
    unstake: ({ account, params, openModal }) => {
      openModal("MODAL_MULTIVERSX_UNDELEGATE", {
        account: account as MultiversXAccount,
        validatorAddress: params.validatorAddress,
      });
    },
    claimRewards: ({ account, params, openModal }) => {
      openModal("MODAL_MULTIVERSX_CLAIM_REWARDS", {
        account: account as MultiversXAccount,
        validatorAddress: params.validatorAddress,
      });
    },
    withdraw: ({ account, params, openModal }) => {
      openModal("MODAL_MULTIVERSX_WITHDRAW", {
        account: account as MultiversXAccount,
        validatorAddress: params.validatorAddress,
      });
    },
  },
  sui: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_SUI_DELEGATE", { account: account as SuiAccount });
    },
    unstake: ({ account, openModal }) => {
      openModal("MODAL_SUI_UNSTAKE", { account: account as SuiAccount });
    },
  },
  evm: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_EVM_DELEGATE", { account: account as StakingAccount });
    },
    unstake: ({ account, params, openModal }) => {
      openModal("MODAL_EVM_UNDELEGATE", {
        account: account as StakingAccount,
        validatorAddress: params.validatorAddress,
      });
    },
    restake: ({ account, params, openModal }) => {
      openModal("MODAL_EVM_REDELEGATE", {
        account: account as StakingAccount,
        validatorAddress: params.validatorAddress,
        validatorDstAddress: params.validatorDstAddress,
      });
    },
  },
  aptos: {
    stake: ({ account, openModal }) => {
      openModal("MODAL_APTOS_STAKE", { account: account as AptosAccount });
    },
    unstake: ({ account, openModal }) => {
      openModal("MODAL_APTOS_UNSTAKE", { account: account as AptosAccount });
    },
    restake: ({ account, openModal }) => {
      openModal("MODAL_APTOS_RESTAKE", { account: account as AptosAccount });
    },
    withdraw: ({ account, openModal }) => {
      openModal("MODAL_APTOS_WITHDRAW", { account: account as AptosAccount });
    },
  },
};

export function openStakingIntentDesktop(
  openModal: OpenModalFn,
  account: Account,
  params: StakingIntentOpenParams,
): void {
  const familyHandlers = DESKTOP_INTENT_HANDLERS[account.currency.family];
  const handler = familyHandlers?.[params.intent];
  if (!handler) return;
  handler({ account, params, openModal });
}
