import { getAccountInfo } from "../network";

export async function getBalance(address: string): Promise<bigint> {
  const accountInfo = await getAccountInfo(address);
  return BigInt(accountInfo.balance);
}
