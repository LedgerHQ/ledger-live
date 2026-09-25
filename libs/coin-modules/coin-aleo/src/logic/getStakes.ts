import invariant from "invariant";
import type BigNumber from "bignumber.js";
import type { Page, Stake, StakeAction } from "@ledgerhq/coin-module-framework/api/index";
import { getStakingPosition } from "../network/utils";
import { isDelegatorBelowMinimum } from "./utils";
import { getValidators } from "./getValidators";
import { lastBlock } from "./lastBlock";
import type {
  AleoCoinConfig,
  AleoStakeNonEarningReason,
  AleoStakingPosition,
  AleoValidator,
} from "../types";

const BONDED_ACTIONS: StakeAction[] = ["delegate", "undelegate"];

export function resolveBondedNonEarningReason({
  address,
  bondedValidator,
  bondedBalance,
  validator,
}: {
  address: string;
  bondedValidator: string | null;
  bondedBalance: BigNumber;
  validator: AleoValidator | undefined;
}): AleoStakeNonEarningReason | undefined {
  if (!validator) return "leftCommittee";
  if (validator.nonEarningReason) return validator.nonEarningReason;
  // snarkVM only enforces the delegator minimum against stakers other than the validator itself.
  if (bondedValidator === address) return undefined;

  return isDelegatorBelowMinimum(bondedBalance) ? "ownStakeBelowMinimum" : undefined;
}

export function toStakes({
  address,
  position,
  validator,
  currentHeight,
}: {
  address: string;
  position: AleoStakingPosition;
  validator: AleoValidator | undefined;
  currentHeight: number;
}): Stake[] {
  const stakes: Stake[] = [];

  if (position.bondedBalance.isGreaterThan(0)) {
    invariant(position.bondedValidator, "aleo: bonded balance without a validator");

    const nonEarningReason = resolveBondedNonEarningReason({
      address,
      bondedValidator: position.bondedValidator,
      bondedBalance: position.bondedBalance,
      validator,
    });

    stakes.push({
      uid: address,
      address,
      delegate: position.bondedValidator,
      state: "active",
      actions: BONDED_ACTIONS,
      asset: { type: "native" },
      amount: BigInt(position.bondedBalance.toFixed(0)),
      ...(nonEarningReason && { details: { nonEarningReason } }),
    });
  }

  if (position.unbondingBalance.isGreaterThan(0)) {
    invariant(position.unbondingHeight !== null, "aleo: unbonding balance without a height");

    const withdrawable = currentHeight >= position.unbondingHeight;

    // No `stateUpdatedAt`: Aleo exposes only the unlock height, not a date.
    stakes.push({
      uid: `${address}:unbonding`,
      address,
      state: withdrawable ? "withdrawable" : "deactivating",
      actions: withdrawable ? ["withdraw"] : [],
      asset: { type: "native" },
      amount: BigInt(position.unbondingBalance.toFixed(0)),
    });
  }

  return stakes;
}

export async function getStakes(config: AleoCoinConfig, address: string): Promise<Page<Stake>> {
  if (!config.enableStaking) return { items: [] };

  const position = await getStakingPosition(config, address);

  const [validators, block] = await Promise.all([
    position.bondedValidator ? getValidators(config) : [],
    position.unbondingBalance.isGreaterThan(0) ? lastBlock(config) : undefined,
  ]);

  return {
    items: toStakes({
      address,
      position,
      validator: validators.find(v => v.address === position.bondedValidator),
      currentHeight: block?.height ?? 0,
    }),
  };
}
