import { getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";
import type { FinalizeTransactionResult } from "../../network/types";

/**
 * Injects device signatures into the PCZT and extracts the final signed V5
 * transaction (finalizeTransaction). `finalizeTransaction` strips the
 * sighash_type byte from transparent sigs internally -- signatures are passed
 * as-is.
 */
export async function combine(args: {
  pczt: string;
  orchardSignatures: string[];
  transparentSignatures: string[];
}): Promise<FinalizeTransactionResult> {
  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });

  if (!client.finalizeTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  return client.finalizeTransaction(args);
}
