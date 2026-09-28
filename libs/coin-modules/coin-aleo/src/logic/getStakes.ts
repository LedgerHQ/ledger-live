import invariant from "invariant";
import type { Page, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { getStakingPosition } from "../network/utils";
import { lastBlock } from "./lastBlock";
import type { AleoCoinConfig } from "../types";

export async function getStakes(config: AleoCoinConfig, address: string): Promise<Page<Stake>> {
  if (!config.enableStaking) return { items: [] };

  const position = await getStakingPosition(config, address);
  const stakes: Stake[] = [];

  if (position.bondedBalance.isGreaterThan(0)) {
    invariant(position.bondedValidator, "aleo: bonded balance without a validator");

    // No `amountDeposited`/`amountRewarded`: rewards compound into the bonded balance,
    // so the chain keeps no split between them.
    stakes.push({
      uid: address,
      address,
      delegate: position.bondedValidator,
      state: "active",
      actions: ["delegate", "undelegate"],
      asset: { type: "native" },
      amount: BigInt(position.bondedBalance.toFixed(0)),
    });
  }

  if (position.unbondingBalance.isGreaterThan(0)) {
    invariant(position.unbondingHeight !== null, "aleo: unbonding balance without a height");

    const { height } = await lastBlock(config);
    const withdrawable = height >= position.unbondingHeight;

    stakes.push({
      uid: `${address}:unbonding`,
      address,
      state: withdrawable ? "withdrawable" : "deactivating",
      actions: withdrawable ? ["withdraw"] : [],
      asset: { type: "native" },
      amount: BigInt(position.unbondingBalance.toFixed(0)),
    });
  }

  return { items: stakes };
}
