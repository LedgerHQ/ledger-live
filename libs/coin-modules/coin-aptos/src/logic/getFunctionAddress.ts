import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";

export function getFunctionAddress(payload: InputEntryFunctionData): string | undefined {
  if (payload.function) {
    const parts = payload.function.split("::");
    return parts.length === 3 && parts[0].length ? parts[0] : undefined;
  }
  return undefined;
}
