import type { TonContext } from "../config";
import { fetchWallet } from "../network";

export async function getNextSequence(context: TonContext, address: string): Promise<bigint> {
  const { seqno } = await fetchWallet(await context.config(), address);
  return BigInt(seqno ?? 0);
}
