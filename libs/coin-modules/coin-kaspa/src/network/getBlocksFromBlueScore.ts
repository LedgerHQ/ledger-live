import { API_BASE } from "./config";
import { ApiResponseBlockInfo } from "../types";

// The endpoint returns an array: a blue score can map to several blocks (BlockDAG).
// `includeTransactions` is false for getBlockInfo (metadata only) and true for getBlock.
export const getBlocksFromBlueScore = async (
  blueScore: number,
  includeTransactions = false,
): Promise<ApiResponseBlockInfo[]> => {
  const response = await fetch(
    `${API_BASE}/blocks-from-bluescore?blueScore=${blueScore}&includeTransactions=${includeTransactions}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );

  if (!response.ok) throw new Error(`kaspa: getBlocksFromBlueScore: status ${response.status}`);

  return (await response.json()) as ApiResponseBlockInfo[];
};
