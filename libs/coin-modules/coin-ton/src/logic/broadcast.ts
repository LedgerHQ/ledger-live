import { Cell } from "@ton/core";
import type { TonContext } from "../config";
import { sendMessage } from "../network";

/**
 * Returns the hash of the external message itself: `listOperations` keys a sent transfer by its
 * inbound message hash, which is that plain cell hash (the node may also report a normalized one).
 */
export async function broadcast(context: TonContext, tx: string): Promise<string> {
  const { message_hash } = await sendMessage(await context.config(), tx);
  if (!message_hash) throw new Error("The TON node did not acknowledge the message");
  return Cell.fromBase64(tx).hash().toString("base64");
}
