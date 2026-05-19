import type { Account } from "@ledgerhq/types-live";
import type { StakingIntent, StakingIntentOpenParams } from "@ledgerhq/live-common/wallet-api/StakingIntent/types";
import type { SolanaAccount, SolanaStake, SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import type { StakeAction } from "@ledgerhq/live-common/families/solana/types";
import { NavigatorName, ScreenName } from "~/const";

type UntypedNavigation = {
  navigate: (route: string, params?: object) => void;
};

type MobileIntentContext = {
  account: Account;
  params: StakingIntentOpenParams;
  navigation: UntypedNavigation;
};

type MobileRoute = {
  route: string;
  screen: string;
  params?: Record<string, unknown>;
};

type MobileIntentHandler = (ctx: MobileIntentContext) => void;

function navigate(navigation: UntypedNavigation, accountId: string, route: MobileRoute): void {
  navigation.navigate(route.route, {
    screen: route.screen,
    params: { ...route.params, accountId },
  });
}

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

function solanaFlow(
  account: SolanaAccount,
  navigation: UntypedNavigation,
  screen: string,
  params: Record<string, unknown>,
): void {
  navigate(navigation, account.id, {
    route: NavigatorName.SolanaDelegationFlow,
    screen,
    params,
  });
}

const MOBILE_INTENT_HANDLERS: Record<string, Partial<Record<StakingIntent, MobileIntentHandler>>> = {
  cosmos: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CosmosDelegationFlow,
        screen: ScreenName.CosmosDelegationValidator,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CosmosUndelegationFlow,
        screen: ScreenName.CosmosUndelegationAmount,
        params: {},
      });
    },
    restake: ({ account, params, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CosmosRedelegationFlow,
        screen: ScreenName.CosmosRedelegationValidator,
        params: { validatorSrcAddress: params.validatorAddress ?? "" },
      });
    },
    claimRewards: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CosmosClaimRewardsFlow,
        screen: ScreenName.CosmosClaimRewardsValidator,
        params: {},
      });
    },
  },
  solana: {
    stake: ({ account, navigation }) => {
      solanaFlow(account as SolanaAccount, navigation, ScreenName.DelegationSummary, {
        delegationAction: { kind: "new" },
      });
    },
    unstake: ({ account, params, navigation }) => {
      openSolanaStakeAction(account as SolanaAccount, navigation, params.validatorAddress, "deactivate");
    },
    restake: ({ account, params, navigation }) => {
      openSolanaStakeAction(account as SolanaAccount, navigation, params.validatorAddress, "reactivate");
    },
    withdraw: ({ account, params, navigation }) => {
      openSolanaStakeAction(account as SolanaAccount, navigation, params.validatorAddress, "withdraw");
    },
  },
  tezos: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.TezosDelegationFlow,
        screen: ScreenName.DelegationStarted,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.TezosDelegationFlow,
        screen: ScreenName.DelegationSummary,
        params: { mode: "undelegate" },
      });
    },
  },
  near: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.NearStakingFlow,
        screen: ScreenName.NearStakingValidator,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.NearUnstakingFlow,
        screen: ScreenName.NearUnstakingAmount,
        params: {},
      });
    },
    withdraw: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.NearWithdrawingFlow,
        screen: ScreenName.NearWithdrawingAmount,
        params: {},
      });
    },
  },
  cardano: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CardanoDelegationFlow,
        screen: ScreenName.CardanoDelegationSummary,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.CardanoUndelegationFlow,
        screen: ScreenName.CardanoUndelegationSummary,
        params: {},
      });
    },
  },
  multiversx: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.MultiversXDelegationFlow,
        screen: ScreenName.MultiversXDelegationValidator,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.MultiversXUndelegationFlow,
        screen: ScreenName.MultiversXUndelegationAmount,
        params: {},
      });
    },
    claimRewards: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.MultiversXClaimRewardsFlow,
        screen: ScreenName.MultiversXClaimRewardsValidator,
        params: {},
      });
    },
    withdraw: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.MultiversXWithdrawFlow,
        screen: ScreenName.MultiversXWithdrawFunds,
        params: {},
      });
    },
  },
  sui: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.SuiDelegateFlow,
        screen: ScreenName.SuiStakingValidator,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.SuiUndelegateFlow,
        screen: ScreenName.SuiUnstakingAmount,
        params: {},
      });
    },
  },
  evm: {
    stake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.EvmDelegationFlow,
        screen: ScreenName.EvmDelegationValidator,
        params: {},
      });
    },
    unstake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.EvmDelegationFlow,
        screen: ScreenName.EvmDelegationAmount,
        params: {},
      });
    },
    restake: ({ account, navigation }) => {
      navigate(navigation, account.id, {
        route: NavigatorName.EvmDelegationFlow,
        screen: ScreenName.EvmDelegationValidator,
        params: {},
      });
    },
  },
};

function openSolanaStakeAction(
  account: SolanaAccount,
  navigation: UntypedNavigation,
  validatorAddress: string | undefined,
  stakeAction: StakeAction,
): void {
  const stakeWithMeta = solanaStakeWithMeta(account, validatorAddress);
  if (!stakeWithMeta) {
    solanaFlow(account, navigation, ScreenName.DelegationSummary, {
      delegationAction: { kind: "new" },
    });
    return;
  }
  solanaFlow(account, navigation, ScreenName.DelegationSummary, {
    delegationAction: {
      kind: "change",
      stakeWithMeta,
      stakeAction,
    },
  });
}

export function openStakingIntentMobile(
  navigation: UntypedNavigation,
  account: Account,
  params: StakingIntentOpenParams,
): void {
  const familyHandlers = MOBILE_INTENT_HANDLERS[account.currency.family];
  const handler = familyHandlers?.[params.intent];
  if (!handler) return;
  handler({ account, params, navigation });
}
