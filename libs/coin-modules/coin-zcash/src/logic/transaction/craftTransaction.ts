import { getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";
import type {
  BuildIronwoodTransactionResult,
  BuildTransactionArgs,
  BuildTransactionResult,
  ZCashClient,
} from "../../network/types";

export type CraftPlan = Omit<
  BuildTransactionArgs,
  "requestId" | "grpcUrl" | "network" | "seedFingerprint"
> & { seedFingerprint?: string };

/**
 * Resolves the engine client and completes the craft plan into native build
 * arguments. Both builders take the same argument shape, so the two entry
 * points below differ only in which one they call.
 */
async function resolveCraft(
  plan: CraftPlan,
): Promise<{ client: ZCashClient; args: Omit<BuildTransactionArgs, "requestId"> }> {
  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });

  return {
    client,
    args: {
      grpcUrl,
      network,
      // Placeholder all-zero 32-byte ZIP-32 seed fingerprint. The Zcash device
      // app only *logs* this field (see app-zcash parser/pczt/{transparent,
      // orchard}.rs) and validates the derivation *path*, not the fingerprint.
      // TODO(zcash): supply the real ZIP-32 seed fingerprint.
      seedFingerprint: plan.seedFingerprint ?? "00".repeat(32),
      ...plan,
    },
  };
}

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
 *
 * Serializes as a **PCZT v1**, which can only carry a V5 transaction — the
 * version the native builder pins on this path. V5 stays valid past NU6.3, so
 * this covers every flow whose bundles the format can express: transparent-only
 * and Orchard. An Ironwood bundle needs a V6, hence `craftIronwoodTransaction`.
 */
export async function craftTransaction(plan: CraftPlan): Promise<BuildTransactionResult> {
  const { client, args } = await resolveCraft(plan);

  if (!client.buildTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  return client.buildTransaction(args);
}

/**
 * Same contract as `craftTransaction`, serialized as a **PCZT v2** carrying a
 * V6 transaction — the only encoding that can hold an Ironwood bundle, which
 * from NU6.3 is where newly shielded value goes.
 *
 * `spends` are read as Ironwood notes (their `position` is looked up in the
 * Ironwood commitment tree), so Orchard notes must not be routed here.
 */
export async function craftIronwoodTransaction(
  plan: CraftPlan,
): Promise<BuildIronwoodTransactionResult> {
  const { client, args } = await resolveCraft(plan);

  if (!client.buildIronwoodTransaction) {
    throw new Error("Zcash V6 (Ironwood) transactions are not supported in this environment");
  }

  return client.buildIronwoodTransaction(args);
}
