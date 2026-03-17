import { ChainAPI } from "../network";

export async function getNextSequence(api: ChainAPI, _address: string): Promise<bigint> {
  const slot = await api.connection.getSlot();
  return BigInt(slot);
}
