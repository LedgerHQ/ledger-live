import { getAccountInfo } from "../network";

export async function getBalance(address: string): Promise<bigint> {
  const accountInfo = await getAccountInfo(address);
  const balance = accountInfo.account_data.Balance
  return BigInt(balance ? balance : 0);
}
