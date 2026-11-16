import { AccountDataNotServedError } from "@domain/api-account-data";
import { AccountStakingSchema, type AccountStaking } from "@domain/entity-account-staking";
import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleStakingApi } from "../host";

/** The most `getStakes` pages one read walks. */
export const MAX_STAKE_PAGES = 20;

async function allStakes(api: CoinModuleStakingApi, subject: string): Promise<Stake[]> {
  const stakes: Stake[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_STAKE_PAGES; page++) {
    const { items, next } = await api.getStakes(subject, cursor);
    stakes.push(...items);
    // A falsy cursor ends the list; one that does not advance would loop.
    if (!next || next === cursor) return stakes;
    cursor = next;
  }
  // Truncated positions would understate the stake: let the next source answer.
  throw new AccountDataNotServedError(`More than ${MAX_STAKE_PAGES} pages of stakes`);
}

const optional = (value: bigint | undefined) =>
  value === undefined ? undefined : value.toString();

/** The `staking` kind of an address: every page of its stakes; a token stake the host does not resolve is left out. */
export async function toAccountStaking(
  currencyId: string,
  subject: string,
  api: CoinModuleStakingApi,
): Promise<AccountStaking> {
  const stakes = await allStakes(api, subject);
  const positions = await Promise.all(
    stakes.map(async stake => {
      const assetId =
        stake.asset.type === "native" ? currencyId : await api.getTokenId?.(stake.asset);
      if (assetId === undefined) return [];
      return [
        {
          id: stake.uid,
          assetId,
          validatorId: stake.delegate || undefined,
          state: stake.state,
          amount: (stake.amount > 0n ? stake.amount : 0n).toString(),
          deposited: optional(stake.amountDeposited),
          rewards: optional(stake.amountRewarded),
          // Modules stamp an unbonding with the date it completes.
          unlockAt:
            stake.state === "deactivating" ? stake.stateUpdatedAt?.toISOString() : undefined,
          actions: stake.actions,
        },
      ];
    }),
  );
  return AccountStakingSchema.parse({ positions: positions.flat() });
}
