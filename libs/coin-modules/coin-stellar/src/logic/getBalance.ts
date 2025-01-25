import { fetchAccount } from "../network";

export async function getBalance(addr: string): Promise<bigint> {
  const { balance } = await fetchAccount(addr);
  return BigInt(balance.toString());
}
