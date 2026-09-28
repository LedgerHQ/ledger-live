import type { ZcashContext } from "../../config";
import { zainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";
import type { FinalizeTransactionResult } from "../../network/types";

/**
 * Injects device signatures into the PCZT and extracts the final signed
 * transaction (finalizeTransaction) -- V5 for an Orchard/transparent send, V6
 * for an Ironwood one. `finalizeTransaction` strips the sighash_type byte from
 * transparent sigs internally -- signatures are passed as-is.
 *
 * `ironwoodSignatures` is omitted rather than passed empty when the device
 * signed no Ironwood action: zcash-utils length-checks each pool's list against
 * the PCZT, so an empty list for a pool the PCZT does not spend fails closed.
 */
export async function combine(
  context: ZcashContext,
  currencyId: string,
  args: {
    pczt: string;
    orchardSignatures: string[];
    transparentSignatures: string[];
    ironwoodSignatures?: string[];
  },
): Promise<FinalizeTransactionResult> {
  const { zaino } = await context.config(currencyId);
  const client = await getZCashClient(zainoEndpoint(zaino.url));

  if (!client.finalizeTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  return client.finalizeTransaction(args);
}
