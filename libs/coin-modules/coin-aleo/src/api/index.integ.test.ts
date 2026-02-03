import invariant from "invariant";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getEnv } from "@ledgerhq/live-env";
import { createApi } from "../api";

describe("createApi", () => {
  const emptyAccountAddress = "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f";
  const testAccountAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const api = createApi({ nodeUrl: getEnv("ALEO_TESTNET_NODE_ENDPOINT") }, "aleo");

  beforeAll(() => {
    setupCalClientStore();
  });

  describe("listOperations", () => {
    it("returns empty array for pristine account", async () => {
      const [operations] = await api.listOperations(emptyAccountAddress, {
        minHeight: 0,
        order: "desc",
      });

      expect(operations).toEqual([]);
    });

    it("returns operations with correct metadata", async () => {
      const testTxId = "at1qe8ml060qvvqp5caxejnc2r4sj3yjx83nfe9mykyx0zyhv5h5yzsfa85j0";
      const testBlockHashOfTx = "ab1ae88smgn0cr80yzzd84kvupawre67j69xcpthcegmcutqew8wgrs6hrxh8";
      const [page] = await api.listOperations(testAccountAddress, {
        minHeight: 0,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === testTxId);

      expect(operation).toMatchObject({
        value: BigInt(20n),
        asset: { type: "native" },
        tx: {
          hash: testTxId,
          fees: BigInt(51060n),
          failed: false,
          block: {
            hash: testBlockHashOfTx,
            height: 168835,
          },
        },
      });
    });

    it.each(["desc", "asc"] as const)(
      "returns paginated operations for account with high activity (%s)",
      async order => {
        const limit = 10;
        const [page1, cursor1] = await api.listOperations(testAccountAddress, {
          minHeight: 0,
          limit,
          order,
        });

        const [page2, cursor2] = await api.listOperations(testAccountAddress, {
          minHeight: 0,
          limit,
          order,
          lastPagingToken: cursor1,
        });

        const firstPage1Timestamp = page1[0]?.tx?.date;
        const firstPage2Timestamp = page2[0]?.tx?.date;
        const lastPage1Timestamp = page1.at(-1)?.tx?.date;
        const lastPage2Timestamp = page2.at(-1)?.tx?.date;
        const page1Hashes = new Set(page1.map(op => op.tx.hash));
        const page2Hashes = new Set(page2.map(op => op.tx.hash));
        const hasOverlap = [...page2Hashes].some(hash => page1Hashes.has(hash));

        // NOTE: this won't be equal to limit, because single transaction can generate multiple operations
        expect(page1.length).toBeGreaterThanOrEqual(limit);
        expect(page2.length).toBeGreaterThanOrEqual(limit);
        expect(cursor1).not.toBeNull();
        expect(cursor2).not.toBeNull();
        expect(hasOverlap).toBe(false);
        expect(firstPage1Timestamp).toBeInstanceOf(Date);
        expect(firstPage2Timestamp).toBeInstanceOf(Date);
        expect(lastPage1Timestamp).toBeInstanceOf(Date);
        expect(lastPage2Timestamp).toBeInstanceOf(Date);
        invariant(firstPage1Timestamp, "guard: missing firstPage1Timestamp");
        invariant(firstPage2Timestamp, "guard: missing firstPage2Timestamp");
        invariant(lastPage1Timestamp, "guard: missing lastPage1Timestamp");
        invariant(lastPage2Timestamp, "guard: missing lastPage2Timestamp");
        expect(lastPage1Timestamp > firstPage2Timestamp).toBe(order === "desc");
        expect(firstPage1Timestamp < lastPage2Timestamp).toBe(order === "asc");
      },
    );

    it.each(["desc", "asc"] as const)(
      "returns operations with min height filter (%s)",
      async order => {
        const minHeight = order === "asc" ? 200_000 : 13_940_000;
        const [page] = await api.listOperations(testAccountAddress, {
          minHeight,
          limit: 10,
          order,
        });

        expect(page.length).toBeGreaterThan(0);
        expect(page.every(op => op.tx.block.height >= minHeight)).toBe(true);
      },
    );
  });
});
