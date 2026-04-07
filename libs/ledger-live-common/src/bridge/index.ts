import type { ScanAccountEvent, ScanAccountEventRaw } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "../account";
import { getAccountBridgeByFamily } from "./impl";
export { getCurrencyBridge, getAccountBridge } from "./impl";

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
    case "discovered": {
      const bridge = await getAccountBridgeByFamily(e.account.currency.family, e.account.id).catch(
        () => undefined,
      );
      return {
        type: e.type,
        account: await toAccountRaw(e.account, undefined, bridge),
      };
    }
    default:
      throw new Error("unsupported ScanAccountEvent " + e.type);
  }
}
