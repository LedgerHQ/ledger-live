import { SolanaExtraTransactionParameters } from "./families/solana/types";

export function hasParametersForSolana(
  params: unknown,
): params is SolanaExtraTransactionParameters {
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
