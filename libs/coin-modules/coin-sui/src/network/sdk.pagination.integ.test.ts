/**
 * Live pagination walk for `getListOperations` on both new transports.
 *
 * The unit suites mock the server, so they cannot catch a `next` gate that only misbehaves once a
 * real node returns a full page whose newest entry is the cursor itself — which is what the inclusive
 * checkpoint bound guarantees on every cursor-fed request. These walk real mainnet history instead.
 */
import { getEnv } from "@ledgerhq/live-env";
import type { SuiCoinConfig, SuiTransport } from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { getListOperations, getOperations, TRANSACTIONS_LIMIT_PER_QUERY } from "./sdk";

const configFor = (transport: SuiTransport): SuiCoinConfig => ({
  status: { type: "active" },
  node: {
    url: getEnv("API_SUI_NODE_PROXY"),
    graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
    grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
  },
  features: { transport },
});

/** Steady, high-volume mainnet history — several pages deep on both arms. */
const ACCOUNT = FIGMENT_SUI_VALIDATOR_ADDRESS;
const TRANSPORTS = ["graphql", "grpc"] as const;
const ORDERS = ["desc", "asc"] as const;

describe("getListOperations pagination (live mainnet)", () => {
  // A mock cannot prove which slice of the range the server picked, so the direction of travel is
  // only really tested here: `asc` must walk forward from the oldest, not re-read the newest window.
  it.each(TRANSPORTS.flatMap(t => ORDERS.map(o => [t, o] as const)))(
    "walks forward without repeating on %s / %s",
    async (transport, order) => {
      const config = configFor(transport);
      const seen = new Set<string>();
      let cursor: string | undefined;
      let pages = 0;

      for (let i = 0; i < 4; i++) {
        const page = await getListOperations(config, ACCOUNT, order, undefined, cursor);
        pages++;
        for (const op of page.items) {
          // A repeat means the window moved backwards or the cursor failed to advance.
          expect(seen.has(op.tx.hash)).toBe(false);
          seen.add(op.tx.hash);
        }
        if (!page.next) break;
        cursor = page.next;
      }

      expect(pages).toBeGreaterThan(1);
      expect(seen.size).toBeGreaterThan(TRANSACTIONS_LIMIT_PER_QUERY);
    },
    180_000,
  );

  it.each(TRANSPORTS)(
    "walks past the second page on %s",
    async transport => {
      const config = configFor(transport);
      const seen = new Set<string>();
      const pageSizes: number[] = [];
      let cursor: string | undefined;

      for (let i = 0; i < 5; i++) {
        const page = await getListOperations(config, ACCOUNT, "desc", undefined, cursor);
        pageSizes.push(page.items.length);
        for (const op of page.items) seen.add(op.tx.hash);
        if (!page.next) break;
        cursor = page.next;
      }

      // A count-based `next` gate stopped this walk at two pages.
      expect(pageSizes.length).toBeGreaterThan(2);
      expect(seen.size).toBeGreaterThan(2 * TRANSACTIONS_LIMIT_PER_QUERY);
    },
    120_000,
  );

  // Account sync reads history once and resumes from the newest stored operation, so a single page
  // caps the account at its newest 50 operations permanently. Only a live node proves the walk
  // continues: the depth depends on the server's own stop reason and resume cursor.
  it.each(TRANSPORTS)(
    "syncs deeper than one page on %s",
    async transport => {
      const operations = await getOperations(configFor(transport), "js:2:sui:x:", ACCOUNT);

      expect(operations.length).toBeGreaterThan(TRANSACTIONS_LIMIT_PER_QUERY);
      expect(new Set(operations.map(op => op.hash)).size).toBe(operations.length);
    },
    180_000,
  );

  it.each(TRANSPORTS)(
    "emits a cursor even though the page re-delivers the previous cursor on %s",
    async transport => {
      const config = configFor(transport);

      const first = await getListOperations(config, ACCOUNT, "desc", undefined, undefined);
      expect(first.items).toHaveLength(TRANSACTIONS_LIMIT_PER_QUERY);
      expect(first.next).toEqual(expect.any(String));

      const cursorDigest = first.items.at(-1)!.tx.hash;
      const second = await getListOperations(config, ACCOUNT, "desc", undefined, first.next);

      // The server re-delivers the cursor's checkpoint by design and the filter drops what was already
      // emitted, so this page is deliberately short and must not repeat the cursor.
      expect(second.items.map(op => op.tx.hash)).not.toContain(cursorDigest);
      expect(second.items.length).toBeLessThan(TRANSACTIONS_LIMIT_PER_QUERY);
      // ...which is exactly why "does the server have more?" cannot be read off the surviving count.
      expect(second.next).toEqual(expect.any(String));
    },
    120_000,
  );
});
