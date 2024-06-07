import { getAccountInfo } from "../api";

export async function getBalance(address: string): Promise<bigint> {
  const accountInfo = await getAccountInfo(address);
  return BigInt(accountInfo.account_data.Balance);
}
