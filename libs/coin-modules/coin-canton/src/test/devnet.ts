import network from "@ledgerhq/live-network";
import type { CantonCoinConfig } from "../config";
import { getNodeId, getOperations } from "../network/gateway";
import type { OperationView } from "../types/gateway";

const SINGLE_PAGE_LIMIT = 5_000;

export const UNKNOWN_PARTY = `nobody::1220${"a".repeat(64)}`;

/** Merges its holdings continuously, so it always has history. */
export async function getDevnetValidatorParty(config: CantonCoinConfig): Promise<string> {
  const { data } = await network<{ validator_id: string }>({
    method: "GET",
    url: `${config.gatewayUrl}/v1/node/${getNodeId(config)}`,
  });
  return data.validator_id;
}

/** Halves the window until one request serves it whole, so the gateway's `next` bug cannot drop rows. */
export async function readRawWindow(
  config: CantonCoinConfig,
  partyId: string,
  highestOffset: number,
  maxWidth: number,
): Promise<{ lowestOffset: number; rows: OperationView[] }> {
  for (let width = maxWidth; width >= 1; width = Math.floor(width / 2)) {
    const lowestOffset = Math.max(0, highestOffset - width);
    const { operations, next } = await getOperations(config, partyId, {
      minOffset: lowestOffset,
      maxOffset: highestOffset,
      limit: SINGLE_PAGE_LIMIT,
    });
    if (next < 0) return { lowestOffset, rows: operations };
  }
  throw new Error(`no devnet window below ${highestOffset} fits one gateway page`);
}
