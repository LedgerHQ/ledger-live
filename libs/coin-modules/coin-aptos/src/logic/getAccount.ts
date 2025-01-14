import { AccountData } from "@aptos-labs/ts-sdk";
import { node } from "./../network";

export async function getAccount(accountAddress: string): Promise<AccountData> {
  const client = await node();
  return client.getAccountInfo({ accountAddress });
}
