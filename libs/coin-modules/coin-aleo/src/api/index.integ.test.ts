import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getEnv } from "@ledgerhq/live-env";
import { createApi } from "../api";

describe("createApi", () => {
  const emptyAccountAddress = "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f";
  const testAccountAddress = "aleo177n83pjn4m995e60z6njza7xg3wankzfwu3rutqtj05usmtza5yqw8gryy";
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

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBe(0);
    });

    it.each(["desc", "asc"] as const)(
      "returns paginated operations for account with high activity (%s)",
      async order => {
        const limit = 2;
        const [page1, cursor1] = await api.listOperations(testAccountAddress, {
          minHeight: 0,
          limit,
          order,
        });

        const [page2, cursor2] = await api.listOperations(testAccountAddress, {
          minHeight: Number(cursor1),
          limit,
          order,
        });

        const firstPage1Timestamp = page1[0]?.tx?.date;
        const firstPage2Timestamp = page2[0]?.tx?.date;
        const lastPage1Timestamp = page1[page1.length - 1]?.tx?.date;
        const lastPage2Timestamp = page2[page2.length - 1]?.tx?.date;
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
        expect(lastPage1Timestamp > firstPage2Timestamp).toBe(order === "desc");
        expect(firstPage1Timestamp < lastPage2Timestamp).toBe(order === "asc");
      },
    );

    it("returns operations with correct metadata", async () => {
      const testTxHash = "at1ngg46ewk3sgv8ncnkhlqjv0np7pdxlcm7mg90a8tlvctpuftmcqsdkj602";
      const testBlockHashOfTx = "ab1apev9hw3zwm5suu6hd6kavgm6xpqnagwn4vqry22nzx0y68r3uzsu0mtss";
      const [page] = await api.listOperations(testAccountAddress, {
        minHeight: 0,
        limit: 2,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === testTxHash);

      expect(operation?.value).toBe(BigInt(981612n));
      expect(operation?.asset.type).toBe("native");

      expect(operation?.tx.hash).toBe(testTxHash);
      expect(operation?.tx.fees).toBe(BigInt(18388n));
      expect(operation?.tx.failed).toBe(false);

      expect(operation?.tx.block.hash).toBe(testBlockHashOfTx);
      expect(operation?.tx.block.height).toBe(13755684);
    });
  });
});
