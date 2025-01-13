import { log } from "@ledgerhq/logs";

export async function getBalance(address: string): Promise<bigint> {
  log("info", "address", address);

  return BigInt(0);
}
