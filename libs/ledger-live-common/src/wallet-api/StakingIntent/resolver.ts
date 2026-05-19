import type { AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "../../account/index";
import type { StakingIntentDescriptor } from "./types";

type IntentResolver = (account: AccountLike) => StakingIntentDescriptor[];

const resolvers = new Map<string, IntentResolver>();

export function registerIntentResolver(family: string, resolver: IntentResolver): void {
  resolvers.set(family, resolver);
}

export function resolveIntents(account: AccountLike): StakingIntentDescriptor[] {
  if (!isAccount(account)) {
    return [];
  }
  const resolver = resolvers.get(account.currency.family);
  if (!resolver) {
    return [];
  }
  return resolver(account);
}

function registerCosmosResolver(): void {
  registerIntentResolver("cosmos", account => {
    if (!isAccount(account)) return [];

    const cosmosResources = (account as Record<string, unknown>).cosmosResources as
      | {
          delegations: Array<{
            validatorAddress: string;
            pendingRewards: { gt: (n: number) => boolean };
          }>;
          unbondings: unknown[];
          redelegations: Array<{ validatorDstAddress: string }>;
          delegatedBalance: { gt: (n: number) => boolean };
          pendingRewardsBalance: { gt: (n: number) => boolean };
          unbondingBalance: { gt: (n: number) => boolean };
        }
      | undefined;

    if (!cosmosResources) return [];

    const hasDelegations = cosmosResources.delegations.length > 0;
    const maxUnbondings = 7;
    const maxRedelegations = 7;

    const canUnbond = hasDelegations && (cosmosResources.unbondings?.length ?? 0) < maxUnbondings;

    const canRedelegate =
      hasDelegations && (cosmosResources.redelegations?.length ?? 0) < maxRedelegations;

    const hasPendingRewards = cosmosResources.pendingRewardsBalance?.gt(0) ?? false;

    const intents: StakingIntentDescriptor[] = [
      {
        name: "delegate",
        enabled: true,
      },
      {
        name: "redelegate",
        enabled: canRedelegate,
        params: ["validatorAddress"],
      },
      {
        name: "unbond",
        enabled: canUnbond,
        params: ["validatorAddress"],
      },
      {
        name: "claimRewards",
        enabled: hasDelegations && hasPendingRewards,
        params: ["validatorAddress"],
      },
    ];

    return intents;
  });
}

registerCosmosResolver();
