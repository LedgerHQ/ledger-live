import { log } from "@ledgerhq/logs";

export function combine(tx: string, signature: string, pubkey?: string): string {
  log("info", "tx", tx);
  log("info", "signature", signature);
  log("info", "pubkey", pubkey);

  throw new Error("UnsupportedMethod");
}
