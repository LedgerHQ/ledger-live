import type { CantonContext } from "../config";
import { isGatewayEnabled, submit } from "../network/gateway";

export async function broadcast(context: CantonContext, signedTx: string): Promise<string> {
  const parsed: { serialized: string; signature: string } = JSON.parse(signedTx);
  const [sig, party] = parsed.signature.split("__PARTY__");
  const config = await context.config();
  if (isGatewayEnabled(config))
    return (await submit(config, party, parsed.serialized, sig)).update_id;
  else throw new Error("Not implemented");
}
