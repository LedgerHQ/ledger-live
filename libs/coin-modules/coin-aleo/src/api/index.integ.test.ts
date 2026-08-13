import invariant from "invariant";
import { createApi } from "../api";
import { TRANSACTION_TYPE } from "../constants";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceFailedTransferPublicTx,
  referenceTransferPublicTx,
  TEST_TOKEN_PROGRAM_ID,
  testnetAddress,
  testnetIncomingPrivateRecord1,
  testnetIncomingPrivateRecord2,
  testnetSelfConversionTx,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPristineAccount } from "../__tests__/helpers/account";
import { encodeOperationsCursor } from "../logic/operationsCursor";
import { accessProvableApi } from "../network/utils";
import type { AleoContext } from "../types";

// The pinned window spans every transfer shape this account has: a public transfer, a rejected
// self-transfer, incoming private credits and token transfers, and a public→private shield.
const MIN_BLOCK_HEIGHT = 18_140_100;
const MAX_BLOCK_HEIGHT = 18_143_000;

describe("createApi", () => {
  const api = createApi("aleo_testnet");
  const contextWithoutPair: AleoContext = {
    config: async () => getTestnetIntegConfig(),
    logger: () => {},
  };
  let context: AleoContext;
  let emptyAddress: string;
  let provableId: string;

  beforeAll(async () => {
    setupCalStore();
    const pristineAccount = await getPristineAccount();
    emptyAddress = pristineAccount.address;

    // accessProvableApi is idempotent per view key, so this returns the already-registered id
    const { uuid } = await accessProvableApi({
      config: getTestnetIntegConfig(),
      viewKey: testnetViewKey,
      provableApi: null,
    });
    invariant(uuid, "guard: missing scanner enrollment id");
    provableId = uuid;
    context = { ...contextWithoutPair, provableId, viewKey: testnetViewKey };
  });

  describe("estimateFees", () => {
    it("returns fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees(context, {
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
    // Seeding a cursor pins the upper bound, so the asserted range stays deterministic however far
    // the scanner has advanced. Every fetch and decrypt still hits the real network.
    const listPinnedRange = (overrides?: { limit?: number; order?: "asc" | "desc" }) =>
      api.listOperations(context, testnetAddress, {
        minHeight: MIN_BLOCK_HEIGHT,
        limit: overrides?.limit ?? 200,
        ...(overrides?.order && { order: overrides.order }),
        cursor: encodeOperationsCursor({
          minHeight: MIN_BLOCK_HEIGHT,
          maxBlockHeight: MAX_BLOCK_HEIGHT,
          order: overrides?.order ?? "asc",
        }),
      });

    it("returns each transaction exactly once over the range", async () => {
      const { items } = await listPinnedRange();

      expect(items.length).toBeGreaterThan(0);
      expect(new Set(items.map(op => op.id)).size).toBe(items.length);
      expect(
        items.every(
          op => op.tx.block.height >= MIN_BLOCK_HEIGHT && op.tx.block.height <= MAX_BLOCK_HEIGHT,
        ),
      ).toBe(true);
    });

    it("returns a public transfer with correct metadata", async () => {
      const { items } = await listPinnedRange();

      expect(items.find(op => op.tx.hash === referenceTransferPublicTx.id)).toMatchObject({
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
      const { items } = await listPinnedRange();

      // this account's only Rejected txs are self-transfers (sender === recipient), which
      // classify as type "IN" (see referenceFailedTransferPublicTx in api.fixture.ts)
      expect(items.find(op => op.tx.hash === referenceFailedTransferPublicTx.id)).toMatchObject({
        type: "IN",
        value: BigInt(referenceFailedTransferPublicTx.value),
        asset: { type: "native" },
        senders: [referenceFailedTransferPublicTx.sender],
        recipients: [referenceFailedTransferPublicTx.recipient],
        tx: { hash: referenceFailedTransferPublicTx.id, failed: true },
      });
    });

    it("completes a shield from its private record instead of emitting it public-only", async () => {
      const { items } = await listPinnedRange();

      // The explorer reports no recipient for a shield; owning its record identifies us as the one.
      expect(items.find(op => op.id === testnetSelfConversionTx.transaction_id)).toMatchObject({
        type: "OUT",
        senders: [testnetAddress],
        recipients: [testnetAddress],
        value: BigInt(testnetSelfConversionTx.amount),
        details: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
    });

    it("returns fully private transfers, which have no public row at all", async () => {
      const { items } = await listPinnedRange();

      expect(
        items.find(op => op.id === testnetIncomingPrivateRecord2.transaction_id.trim()),
      ).toMatchObject({
        type: "IN",
        value: 50000n,
        asset: { type: "native" },
        senders: [testnetIncomingPrivateRecord2.sender],
        recipients: [testnetAddress],
        details: { transactionType: "private" },
      });
    });

    it("returns token operations keyed by program id, with no CAL lookup", async () => {
      const { items } = await listPinnedRange();

      expect(
        items.find(op => op.id === testnetIncomingPrivateRecord1.transaction_id.trim()),
      ).toMatchObject({
        type: "IN",
        asset: { type: "arc22", assetReference: TEST_TOKEN_PROGRAM_ID },
        details: { transactionType: "private" },
      });
    });

    it.each(["asc", "desc"] as const)("orders the range %s", async order => {
      const { items } = await listPinnedRange({ order });

      const heights = items.map(op => op.tx.block.height);
      const expected = [...heights].sort((a, b) => (order === "asc" ? a - b : b - a));

      expect(heights).toEqual(expected);
    });

    it("pages the range with a stable, non-overlapping cursor", async () => {
      const { items: all } = await listPinnedRange();
      invariant(all.length > 4, "guard: pinned range must span more than four operations");

      const { items: page1, next: cursor1 } = await listPinnedRange({ limit: 2 });
      expect(page1).toEqual(all.slice(0, 2));
      invariant(cursor1, "guard: missing cursor after first page");

      const { items: page2 } = await api.listOperations(context, testnetAddress, {
        minHeight: MIN_BLOCK_HEIGHT,
        limit: 2,
        cursor: cursor1,
      });

      expect(page2).toEqual(all.slice(2, 4));
      const page1Hashes = new Set(page1.map(op => op.tx.hash));
      expect(page2.some(op => page1Hashes.has(op.tx.hash))).toBe(false);
    });

    it("returns an empty page when the range is empty", async () => {
      const result = await api.listOperations(context, testnetAddress, {
        minHeight: MAX_BLOCK_HEIGHT,
        cursor: encodeOperationsCursor({
          minHeight: MAX_BLOCK_HEIGHT,
          maxBlockHeight: MIN_BLOCK_HEIGHT,
          order: "asc",
        }),
      });

      expect(result).toEqual({ items: [], next: undefined });
    });

    it("rejects a cursor replayed against a different range", async () => {
      const { next } = await listPinnedRange({ limit: 2 });
      invariant(next, "guard: missing cursor after first page");

      await expect(
        api.listOperations(context, testnetAddress, {
          minHeight: MIN_BLOCK_HEIGHT + 1,
          cursor: next,
        }),
      ).rejects.toThrow(/does not match the requested range/);
    });

    it.each([
      ["no pair at all", () => ({})],
      ["only provableId", () => ({ provableId })],
      ["only viewKey", () => ({ viewKey: testnetViewKey })],
    ])("throws when the context carries %s", async (_label, partial) => {
      await expect(
        api.listOperations({ ...contextWithoutPair, ...partial() }, testnetAddress, {
          minHeight: MIN_BLOCK_HEIGHT,
        }),
      ).rejects.toThrow(/requires provableId and viewKey/);
    });

    it("throws for an unknown scanner enrollment id", async () => {
      await expect(
        api.listOperations(
          {
            ...contextWithoutPair,
            provableId: "00000000-0000-0000-0000-000000000000",
            viewKey: testnetViewKey,
          },
          testnetAddress,
          { minHeight: MIN_BLOCK_HEIGHT },
        ),
      ).rejects.toMatchObject({ name: "AleoApiConfigurationResetError" });
    });

    it("rejects a malformed cursor", async () => {
      await expect(
        api.listOperations(context, testnetAddress, {
          minHeight: MIN_BLOCK_HEIGHT,
          cursor: "!!!not-a-cursor!!!",
        }),
      ).rejects.toThrow(/malformed listOperations cursor/);
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock(context);

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBeGreaterThan(0);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getBalance", () => {
    it("returns the balance for a valid address", async () => {
      // not an exact value: testnetAddress's public balance shifts as the team runs more
      // transactions against it, so only shape + non-negativity are checked here.
      const balance = await api.getBalance(context, testnetAddress);

      expect(balance).toEqual([expect.objectContaining({ asset: { type: "native" } })]);
      expect(balance[0].value).toBeGreaterThanOrEqual(0n);
    });

    it("returns an empty array for a non-existing valid address", async () => {
      const balance = await api.getBalance(context, emptyAddress);

      expect(balance).toEqual([]);
    });

    it("throws an error for an invalid address", async () => {
      const invalidAddress = "invalid_address";

      await expect(api.getBalance(context, invalidAddress)).rejects.toMatchObject({
        name: "LedgerAPI4xx",
        status: 404,
      });
    });
  });
});
