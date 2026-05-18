import type { ScanAccountEvent, ScanAccountEventRaw } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "../account";
export { getCurrencyBridge, getAccountBridge, getAccountBridgeByFamily } from "./impl";

export async function fromScanAccountEventRaw(raw: ScanAccountEventRaw): Promise<ScanAccountEvent> {
  switch (raw.type) {
    case "discovered":
      return {
        type: raw.type,
        account: await fromAccountRaw(raw.account),
      };

    default:
      throw new Error("unsupported ScanAccountEvent " + raw.type);
  }
}
export async function toScanAccountEventRaw(e: ScanAccountEvent): Promise<ScanAccountEventRaw> {
  switch (e.type) {
    case "discovered":
      return {
        type: e.type,
        account: await toAccountRaw(e.account),
      };

    default:
      throw new Error("unsupported ScanAccountEvent " + e.type);
  }
}
