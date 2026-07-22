import invariant from "invariant";
import { createApi } from "../api";
import { TRANSACTION_TYPE } from "../constants";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceFailedTransferPublicTx,
  referenceTransferPublicTx,
  testnetAddress,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPristineAccount } from "../__tests__/helpers/account";

describe("createApi", () => {
  const api = createApi(getTestnetIntegConfig(), "aleo_testnet");
  let emptyAddress: string;

  beforeAll(async () => {
    setupCalStore();
    const pristineAccount = await getPristineAccount();
    emptyAddress = pristineAccount.address;
  });

  describe("estimateFees", () => {
    it("returns fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        amount: 100n,
        sender: testnetAddress,
        recipient: emptyAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("listOperations", () => {
    it("returns empty array for pristine account", async () => {
      const { items: operations } = await api.listOperations(emptyAddress, {
        minHeight: 0,
        order: "desc",
      });

      expect(operations).toEqual([]);
    });

    it("returns operations with correct metadata", async () => {
      const { items: page } = await api.listOperations(testnetAddress, {
        minHeight: 0,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === referenceTransferPublicTx.id);

      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(referenceTransferPublicTx.value),
        asset: { type: "native" },
        senders: [referenceTransferPublicTx.sender],
        recipients: [referenceTransferPublicTx.recipient],
        tx: {
          hash: referenceTransferPublicTx.id,
          fees: BigInt(referenceTransferPublicTx.fee),
          failed: false,
          block: {
            hash: referenceTransferPublicTx.blockHash,
            height: referenceTransferPublicTx.blockHeight,
          },
        },
      });
    });

    it("returns a failed operation for a known rejected transaction", async () => {
      const { items: page } = await api.listOperations(testnetAddress, {
        minHeight: referenceFailedTransferPublicTx.blockHeight,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === referenceFailedTransferPublicTx.id);

      // this account's only Rejected txs are self-transfers (sender === recipient), which
      // classify as type "IN" (see referenceFailedTransferPublicTx in api.fixture.ts)
      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(referenceFailedTransferPublicTx.value),
        asset: { type: "native" },
        senders: [referenceFailedTransferPublicTx.sender],
        recipients: [referenceFailedTransferPublicTx.recipient],
        tx: {
          hash: referenceFailedTransferPublicTx.id,
          fees: BigInt(referenceFailedTransferPublicTx.fee),
          failed: true,
          block: {
            hash: referenceFailedTransferPublicTx.blockHash,
            height: referenceFailedTransferPublicTx.blockHeight,
          },
        },
      });
    });
    it.each(["desc", "asc"] as const)(
      "returns 2 non-overlapping, correctly ordered pages (%s)",
      async order => {
        const limit = 3;
        const { items: page1, next: cursor1 } = await api.listOperations(testnetAddress, {
          minHeight: 0,
          limit,
          order,
        });

        const { items: page2, next: cursor2 } = await api.listOperations(
          testnetAddress,
          cursor1
            ? {
                minHeight: 0,
                limit,
                order,
                cursor: cursor1,
              }
            : {
                minHeight: 0,
                limit,
                order,
              },
        );

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
        expect(cursor1).not.toBe("");
        expect(cursor2).not.toBe("");
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
        const minHeight = referenceFailedTransferPublicTx.blockHeight;
        const { items: page } = await api.listOperations(testnetAddress, {
          minHeight,
          limit: 10,
          order,
        });

        expect(page.length).toBeGreaterThan(0);
        expect(page.every(op => op.tx.block.height >= minHeight)).toBe(true);
        expect(page.some(op => op.tx.hash === referenceTransferPublicTx.id)).toBe(false);
      },
    );
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBeGreaterThan(0);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getBalance", () => {
    it("returns the balance for a valid address", async () => {
      // not an exact value: testnetAddress's public balance shifts as the team runs more
      // transactions against it, so only shape + positivity are checked here.
      const balance = await api.getBalance(testnetAddress);

      expect(balance).toEqual([expect.objectContaining({ asset: { type: "native" } })]);
      expect(balance[0].value).toBeGreaterThan(0n);
    });

    it("returns an empty array for a non-existing valid address", async () => {
      const balance = await api.getBalance(emptyAddress);

      expect(balance).toEqual([]);
    });

    it("throws an error for an invalid address", async () => {
      const invalidAddress = "invalid_address";

      await expect(api.getBalance(invalidAddress)).rejects.toMatchObject({
        name: "LedgerAPI4xx",
        status: 404,
      });
    });
  });
});
