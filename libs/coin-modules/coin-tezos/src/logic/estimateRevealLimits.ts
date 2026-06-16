import { log } from "@ledgerhq/logs";
import { getRevealFee, getRevealGasLimit } from "@taquito/taquito";
import type { TezosConfig } from "../config";
import { getTezosToolkit } from "./tezosToolkit";

type RevealLimits = { fee: number; gasLimit: number; storageLimit: number };

/**
 * Estimate the reveal-operation limits for an unrevealed manager account, clamped to
 * the configured minimums. Falls back to the SDK helpers when node estimation fails
 * (some addresses error with "inconsistent_hash").
 */
export async function estimateRevealLimits(
  tezosToolkit: ReturnType<typeof getTezosToolkit>,
  address: string,
  feesConfig: TezosConfig["fees"],
): Promise<RevealLimits> {
  type RevealEstimate = { gasLimit?: number; storageLimit?: number; suggestedFeeMutez?: number };
  let revealEstimate: RevealEstimate | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    revealEstimate = (await tezosToolkit.estimate.reveal()) as RevealEstimate | undefined;
  } catch (error) {
    log("estimate-error", "error estimating reveal fees, trying to use getRevealGasLimit", {
      error,
    });
    revealEstimate = {
      gasLimit: getRevealGasLimit(address),
      suggestedFeeMutez: getRevealFee(address),
    };
  }
  return {
    fee: Math.max(feesConfig.minFees, revealEstimate?.suggestedFeeMutez ?? getRevealFee(address)),
    gasLimit: Math.max(feesConfig.minRevealGasLimit, revealEstimate?.gasLimit ?? 0),
    storageLimit: Math.max(feesConfig.minStorageLimit, revealEstimate?.storageLimit ?? 0),
  };
}
