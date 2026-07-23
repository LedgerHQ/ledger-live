import { API_BASE } from "./config";
import { ApiResponseBlockInfo } from "../types";

// The endpoint returns an array: a blue score can map to several blocks (BlockDAG).
// `includeTransactions` is false for getBlockInfo (metadata only) and true for getBlock.
export const getBlocksFromBlueScore = async (
  blueScore: number,
  includeTransactions = false,
): Promise<ApiResponseBlockInfo[]> => {
  // Guard the URL params: blueScore must be a non-negative integer, and the query is built via
  // URLSearchParams (encodes every value). Together these prevent any value from injecting into the
  // request URL (SSRF hardening; CodeQL flags raw interpolation on this path).
  if (!Number.isInteger(blueScore) || blueScore < 0) {
    throw new Error(`kaspa: getBlocksFromBlueScore: invalid blueScore ${blueScore}`);
  }

  const query = new URLSearchParams({
    blueScore: String(blueScore),
    includeTransactions: String(includeTransactions),
  });

  const response = await fetch(`${API_BASE}/blocks-from-bluescore?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error(`kaspa: getBlocksFromBlueScore: status ${response.status}`);

  return (await response.json()) as ApiResponseBlockInfo[];
};
