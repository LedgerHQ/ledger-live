import type { CantonContext } from "../config";
import { isGatewayEnabled, submit } from "../network/gateway";
import { decodeSigned } from "./envelope";

export async function broadcast(context: CantonContext, signedTx: string): Promise<string> {
  const { party, serialized, signature } = decodeSigned(signedTx);
  const config = await context.config();
  if (!isGatewayEnabled(config)) throw new Error("Not implemented");

  const { update_id } = await submit(config, party, serialized, signature);
  if (!update_id) {
    throw new Error("canton: broadcast returned no transaction id");
  }
  return update_id;
}
