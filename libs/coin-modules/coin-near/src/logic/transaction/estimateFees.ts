import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { getActionCosts, getGasPrice } from "../../network";
import { computeFees } from "../fees";
import { pooledAmount } from "../staking/pooledAmount";
import { resolveTarget, type NearIntent } from "./craftTransaction";

/** A caller-supplied gas price, if it is a usable positive integer. */
function overriddenGasPrice(parameters: FeeEstimation["parameters"]): string | undefined {
  const value = parameters?.gasPrice;

  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    return undefined;
  }

  const gasPrice = new BigNumber(value.toString());

  return gasPrice.isInteger() && gasPrice.gt(0) ? gasPrice.toFixed() : undefined;
}

// Fee for an intent, in yoctoNEAR, sourced from the protocol config since nothing preloads on this
// path (preload defaults are zeros, which would silently yield a zero fee). A missing recipient
// prices as zero rather than erroring, so a form can price while still being filled in.
export async function estimateFees(
  intent: NearIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const { mode, receiverId } = resolveTarget(intent);

  if (!receiverId) {
    return { value: 0n, parameters: {} };
  }

  const override = overriddenGasPrice(customFeesParameters);
  const [liveGasPrice, costs] = await Promise.all([
    override === undefined ? getGasPrice() : Promise.resolve(override),
    getActionCosts(),
  ]);

  const fees = computeFees({
    mode,
    recipient: receiverId,
    useAllAmount: intent.useAllAmount ?? false,
    gasPrice: new BigNumber(liveGasPrice),
    costs,
  });

  const value = BigInt(fees.toFixed(0));

  // Unstaking and withdrawing move funds the pool holds, not the liquid balance, so "use all"
  // cannot be derived from the native balance. `computeUseAllAmount` prefers `parameters.amount`
  // when the module supplies it, which is the only way to tell the framework the real ceiling.
  if (mode === "unstake" || mode === "withdraw") {
    const pooled = await pooledAmount(mode, intent.sender, receiverId);
    return { value, parameters: { gasPrice: liveGasPrice, amount: pooled } };
  }

  return { value, parameters: { gasPrice: liveGasPrice } };
}
