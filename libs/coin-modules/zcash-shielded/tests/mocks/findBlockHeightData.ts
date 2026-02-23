import { http, HttpResponse } from "msw";
import { JSON_RPC_SERVER } from "../../src/constants";

export type BlockAtHeight = {
  height: number;
  time: number;
  hash: string;
};

export type FindBlockHeightScenario = {
  /**
   * Height of the chain tip as returned by `getblockcount`.
   * Valid block heights for this scenario are in the range 0..blockCount (inclusive).
   */
  blockCount: number;
  getBlockByHeight: (height: number) => BlockAtHeight;
};

/**
 * Large chain: blocks 0..1275 have time 1000, block 1276+ have time 1234, 1235, ...
 * findBlockHeight(1234) => 1276.
 */
export const largeChainScenario: FindBlockHeightScenario = {
  blockCount: 2000,
  getBlockByHeight: (height: number) => ({
    height,
    time: height < 1276 ? 1000 : 1234 + (height - 1276),
    hash: `hash${height}`,
  }),
};

/**
 * Small chain: heights 0..10 with times 100, 200, ..., 1100.
 * findBlockHeight(600) => 5, findBlockHeight(550) => 4, findBlockHeight(50) => 0, findBlockHeight(2000) => 10.
 */
export const smallChainScenario: FindBlockHeightScenario = {
  blockCount: 10,
  getBlockByHeight: (height: number) => ({
    height,
    time: 100 + height * 100,
    hash: `hash${height}`,
  }),
};

/**
 * Empty chain: no blocks.
 */
export const emptyChainScenario: FindBlockHeightScenario = {
  blockCount: 0,
  getBlockByHeight: (_height: number) => {
    throw new Error("empty chain has no blocks");
  },
};

function isNumericString(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

/**
 * Returns MSW handlers for getblockcount and getblock by height for the given scenario.
 * Only responds when method is getblockcount or getblock with numeric params[0]; otherwise
 * the request falls through to the default handler (e.g. getblock by hash from testAccounts).
 */
export function createFindBlockHeightHandlers(
  scenario: FindBlockHeightScenario,
): ReturnType<typeof http.post>[] {
  return [
    http.post(`${JSON_RPC_SERVER}`, async ({ request }) => {
      const body = (await request.clone().json()) as {
        method?: string;
        params?: unknown[];
      };

      if (body.method === "getblockcount") {
        return HttpResponse.json({ result: scenario.blockCount });
      }

      if (body.method === "getblock" && body.params?.[0] !== undefined) {
        const param = body.params[0];
        if (isNumericString(param)) {
          const height = parseInt(param, 10);
          if (
            scenario.blockCount === 0 ||
            height < 0 ||
            height > scenario.blockCount
          ) {
            return HttpResponse.json({
              error: { code: -5, message: "block height not in best chain" },
            });
          }
          const block = scenario.getBlockByHeight(height);
          return HttpResponse.json({ result: block });
        }
      }

      // Do not respond so the default handler can handle getblock by hash etc.
    }),
  ];
}
