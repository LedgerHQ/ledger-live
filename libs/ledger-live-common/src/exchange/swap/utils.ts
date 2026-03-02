import { SolanaExtraParameters } from "./types";

export function isSolanaExtraParameters(params: unknown): params is SolanaExtraParameters {
  return (
    params !== undefined &&
    params !== null &&
    typeof params === "object" &&
    "data" in params &&
    typeof params.data === "string" &&
    "templateId" in params &&
    typeof params.templateId === "string"
  );
}
