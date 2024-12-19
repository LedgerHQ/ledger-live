import { fetchTronAccount } from "../network";

export async function getBalance(address: string): Promise<bigint> {
  const account = await fetchTronAccount(address);
  return BigInt(account[0].balance);
}
