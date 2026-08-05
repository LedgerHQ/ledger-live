import { CosmosAPI } from "../../network/Cosmos";

export async function getNextSequence(api: CosmosAPI, address: string): Promise<bigint> {
  const { sequence } = await api.getAccount(address);
  return BigInt(sequence);
}
