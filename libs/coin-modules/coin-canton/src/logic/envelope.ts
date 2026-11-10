import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import type { CantonCraftedEnvelope, CantonSignedEnvelope } from "../types/transaction";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

function parseRecord(encoded: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(encoded);
  } catch {
    throw new InvalidTransactionError("canton: the transaction is not JSON");
  }
  if (!isRecord(parsed)) {
    throw new InvalidTransactionError("canton: the transaction is not a JSON object");
  }
  return parsed;
}

export function decodeCrafted(encoded: string): CantonCraftedEnvelope {
  const { party, serialized, json } = parseRecord(encoded);
  const isTransfer =
    isRecord(json) &&
    isRecord(json.transaction) &&
    isRecord(json.metadata) &&
    // The onboarding shape, which the device signs as topology transactions.
    !("transactions" in json);
  if (!isFilledString(party) || !isFilledString(serialized) || !isTransfer) {
    throw new InvalidTransactionError("canton: not a crafted Canton transfer");
  }
  return { party, serialized, json };
}

export function decodeSigned(encoded: string): CantonSignedEnvelope {
  const { party, serialized, signature } = parseRecord(encoded);
  if (!isFilledString(party) || !isFilledString(serialized) || !isFilledString(signature)) {
    throw new InvalidTransactionError("canton: not a signed Canton transaction");
  }
  return { party, serialized, signature };
}
