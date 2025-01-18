import { getAccountInfo } from "../../network/node";

// Could be getAccountInfo so it is used in both bridge and api
export async function getBalance(address: string): Promise<bigint> {
  const accountInfo = await getAccountInfo(address);
  return BigInt(accountInfo.account_data.Balance);
}
