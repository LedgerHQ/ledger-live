import { WriteSetChange, WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";

export function isWriteSetChangeWriteResource(
  change: WriteSetChange,
): change is WriteSetChangeWriteResource {
  return (change as WriteSetChangeWriteResource).data !== undefined;
}
