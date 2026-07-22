import { getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";
import type { BuildTransactionArgs, BuildTransactionResult } from "../../network/types";

export type CraftPlan = Omit<
  BuildTransactionArgs,
  "requestId" | "grpcUrl" | "network" | "seedFingerprint"
> & { seedFingerprint?: string };

/**
 * Builds the PCZT for a fully-resolved craft plan (ufvk, accountIndex,
 * feeZat, spends/transparentInputs/outputs already selected by the caller --
 * see bridge/signOperation.ts, which resolves them from the account +
 * transaction via mapSpends/mapTransparentInputs/mapOutputs). Delegates the
 * actual native build to the `network/` engine (zcash-utils).
 *
 * The Public→* transfer flows also spend transparent UTXOs, so the caller
 * resolves those before calling this function; this function itself is
 * transfer-type agnostic -- it only assembles the PCZT from already-selected
 * inputs/outputs.
 */
export async function craftTransaction(plan: CraftPlan): Promise<BuildTransactionResult> {
  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });

  if (!client.buildTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  return client.buildTransaction({
    grpcUrl,
    network,
    // Placeholder all-zero 32-byte ZIP-32 seed fingerprint. The Zcash device
    // app only *logs* this field (see app-zcash parser/pczt/{transparent,
    // orchard}.rs) and validates the derivation *path*, not the fingerprint.
    // TODO(zcash): supply the real ZIP-32 seed fingerprint.
    seedFingerprint: plan.seedFingerprint ?? "00".repeat(32),
    ...plan,
  });
}
