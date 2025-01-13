import { log } from "@ledgerhq/logs";

export async function estimateFees(addr: string, amount: bigint): Promise<bigint> {
  log("info", "addr", addr);
  log("info", "amount", amount.toString());

  return amount;
}
