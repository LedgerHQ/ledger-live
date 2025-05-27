import { WriteSetChangeWriteResource, Event } from "@aptos-labs/ts-sdk";
import { AptosTransaction } from "../types";
import { isWriteSetChangeWriteResource } from "./isWriteSetChangeWriteResource";

export function getResourceAddress(
  tx: AptosTransaction,
  event: Event,
  event_name: string,
  getAddressProcessor: (
    change: WriteSetChangeWriteResource,
    event: Event,
    event_name: string,
  ) => string | null,
): string | null {
  for (const change of tx.changes) {
    if (isWriteSetChangeWriteResource(change)) {
      const address = getAddressProcessor(change, event, event_name);
      if (address !== null) {
        return address;
      }
    }
  }
  return null;
}
