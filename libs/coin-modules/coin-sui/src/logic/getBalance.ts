import { getAccount } from "../network";

export async function getBalance(address: string): Promise<bigint> {
  const { balance } = await getAccount(address);
  return BigInt(balance.toString());
}
