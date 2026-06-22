import { WriteSetChange, WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";
import { WRITE_RESOURCE } from "../constants";

export function isWriteSetChangeWriteResource(
  change: WriteSetChange,
): change is WriteSetChangeWriteResource {
  return change.type === WRITE_RESOURCE;
}
