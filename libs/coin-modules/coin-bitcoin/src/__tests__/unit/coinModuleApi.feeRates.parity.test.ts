import type { Account } from "@ledgerhq/types-live";
import { getFeeRate } from "../../logic/getFeeRate";
import {
  feesHandler,
  networkHandler,
  server,
  testConfig,
  useMswServer,
} from "../../logic/tests/helpers/msw";

/**
 * The coin module API reads the explorer's fast, medium and slow rates as the legacy bridge does
 * (`getAccountNetworkInfo`): both are fed the same explorer answers, and each speed must get the same
 * rate.
 */

let bridgeExplorer: { getFees: () => Promise<unknown>; getNetwork?: () => Promise<unknown> };

jest.mock("../../getWalletAccount", () => ({
  getWalletAccount: jest.fn(() => ({ xpub: { explorer: bridgeExplorer } })),
}));

import { getAccountNetworkInfo } from "../../getAccountNetworkInfo";

useMswServer();

const CASES: { name: string; fees: Record<string, number>; relayFee: string | null }[] = [
  // Real explorer answers (2026-10-16).
  {
    name: "bitcoin, equal rates",
    fees: { "2": 1178, "4": 1140, "6": 1103 },
    relayFee: "0.00001",
  },
  {
    name: "litecoin, two equal rates",
    fees: { "2": 1002, "4": 1001, "6": 1000 },
    relayFee: "0.00001",
  },
  {
    name: "dogecoin, distinct rates",
    fees: { "2": 50672097, "4": 25837285, "6": 1002474 },
    relayFee: "0.00001",
  },
  {
    name: "rates below the relay floor",
    fees: { "2": 3000, "4": 2000, "6": 1000 },
    relayFee: "0.00005",
  },
  { name: "no relay fee from the node", fees: { "2": 100, "4": 100, "6": 100 }, relayFee: null },
];

describe("explorer fee rates: coin module API vs bridge", () => {
  it.each(CASES)("$name", async ({ fees, relayFee }) => {
    bridgeExplorer = {
      getFees: async () => ({ ...fees, last_updated: 1792153394 }),
      ...(relayFee === null ? {} : { getNetwork: async () => ({ relay_fee: relayFee }) }),
    };
    server.use(feesHandler(fees), networkHandler(relayFee));

    const bridge = await getAccountNetworkInfo({
      currency: { id: "bitcoin" },
    } as unknown as Account);
    const config = testConfig("bitcoin");
    const module = await Promise.all(
      bridge.feeItems.items.map(async item =>
        String((await getFeeRate(config, { feesStrategy: item.speed })).feePerByte),
      ),
    );

    expect(module).toEqual(bridge.feeItems.items.map(item => item.feePerByte.toFixed()));
  });
});
