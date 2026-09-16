import BigNumber from "bignumber.js";
import {
  COUNTERPARTY_ACCOUNT_HASH,
  COUNTERPARTY_PUBLIC_KEY,
  INCOMING_TX,
  INDEXER_ACCOUNT_HASH,
  INDEXER_PUBLIC_KEY,
  OUTGOING_TX,
  PUBLIC_KEY_TARGET_TX,
  STAKING_TX,
  txWith,
} from "../__tests__/fixtures";
import { CASPER_INDEXER_MAX_PAGE_SIZE as PAGE_SIZE } from "../constants";
import { createMockContext } from "../__tests__/fixtures/config.fixture";
import { fetchTxsPage } from "../network/api";
import { ITxnHistoryData } from "../types/network";
import { getEstimatedFees } from "./estimateFees";
import { listOperations, mapTxToOps } from "./listOperations";
import { casperAccountHashFromPublicKey } from "./validateAddress";

jest.mock("../network/api");

const mockFetchTxsPage = jest.mocked(fetchTxsPage);
const context = createMockContext();

function serve(records: ITxnHistoryData[]): void {
  mockFetchTxsPage.mockImplementation(async (_config, _address, page) => ({
    data: records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page_count: Math.ceil(records.length / PAGE_SIZE),
    item_count: records.length,
  }));
}

const ACCOUNT_ID = "js:2:casper:0202ba6dc98cbe67:casper_wallet";
const FEES = new BigNumber("100000000");

/** A synthetic outgoing history, newest first, mirroring the indexer's descending order. */
function history(count: number): ITxnHistoryData[] {
  return Array.from({ length: count }, (_, i) =>
    txWith(OUTGOING_TX, {
      deploy_hash: `deploy-${String(i).padStart(4, "0")}`,
      block_height: 1_000_000 - i,
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listOperations", () => {
  describe("mapping", () => {
    it("maps an outgoing transfer with the amount and the charged cost kept separate", async () => {
      serve([OUTGOING_TX]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      const date = new Date("2022-11-18T15:38:19Z");
      expect(items).toEqual([
        {
          id: `${OUTGOING_TX.deploy_hash}-OUT`,
          type: "OUT",
          senders: [INDEXER_ACCOUNT_HASH],
          recipients: [OUTGOING_TX.args.target.parsed],
          value: 2_500_000_000n,
          asset: { type: "native" },
          tx: {
            hash: OUTGOING_TX.deploy_hash,
            block: {
              height: 1272937,
              hash: OUTGOING_TX.block_hash,
              time: date,
            },
            fees: BigInt(OUTGOING_TX.cost),
            feesPayer: INDEXER_ACCOUNT_HASH,
            date,
            failed: false,
          },
        },
      ]);
    });

    it("maps an incoming transfer", async () => {
      serve([INCOMING_TX]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items).toEqual([
        expect.objectContaining({
          id: `${INCOMING_TX.deploy_hash}-IN`,
          type: "IN",
          senders: [COUNTERPARTY_ACCOUNT_HASH],
          recipients: [INDEXER_ACCOUNT_HASH],
          value: 12_000_000_000n,
        }),
      ]);
    });

    it("yields both an OUT and an IN for a self-transfer", async () => {
      const selfTransfer = txWith(OUTGOING_TX, {
        args: {
          ...OUTGOING_TX.args,
          target: { cl_type: { ByteArray: 32 }, parsed: INDEXER_ACCOUNT_HASH },
        },
      });
      serve([selfTransfer]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.id)).toEqual([
        `${selfTransfer.deploy_hash}-OUT`,
        `${selfTransfer.deploy_hash}-IN`,
      ]);
    });

    it("hashes a PublicKey target and uses a ByteArray target as-is", async () => {
      // The captured PublicKey-target record is sent by the counterparty, so list it for them.
      serve([PUBLIC_KEY_TARGET_TX]);
      const { items } = await listOperations(context, COUNTERPARTY_PUBLIC_KEY, {
        minHeight: 0,
      });

      const target = PUBLIC_KEY_TARGET_TX.args.target.parsed;
      expect(items[0].recipients).toEqual([casperAccountHashFromPublicKey(target)]);
      expect(items[0].recipients[0]).not.toBe(target);

      serve([OUTGOING_TX]);
      const byteArray = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });
      expect(byteArray.items[0].recipients).toEqual([OUTGOING_TX.args.target.parsed]);
    });

    it("flags a failed operation from error_message", async () => {
      serve([txWith(OUTGOING_TX, { error_message: "User error: 1" })]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(items.map(o => o.tx.failed)).toEqual([true]);
    });
  });

  describe("transfer id", () => {
    it("omits the transfer id when the indexer reports it as null", async () => {
      serve([OUTGOING_TX]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.details)).toEqual([undefined]);
    });

    it("carries a numeric transfer id through as a string", async () => {
      serve([INCOMING_TX]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.details)).toEqual([{ transferId: "7772882" }]);
    });

    it("keeps a transfer whose args omit the id key entirely", async () => {
      const noId = txWith(INCOMING_TX, {
        args: { amount: INCOMING_TX.args.amount, target: INCOMING_TX.args.target },
      });
      serve([noId]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.id)).toEqual([`${noId.deploy_hash}-IN`]);
      expect(items.map(o => o.details)).toEqual([undefined]);
    });

    it("keeps a zero transfer id rather than dropping it", async () => {
      serve([
        txWith(INCOMING_TX, {
          args: {
            ...INCOMING_TX.args,
            id: { cl_type: { Option: "U64" }, parsed: 0 },
          },
        }),
      ]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.details)).toEqual([{ transferId: "0" }]);
    });
  });

  describe("filtering", () => {
    it("skips the staking deploys the same feed carries", async () => {
      serve([OUTGOING_TX, STAKING_TX]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.tx.hash)).toEqual([OUTGOING_TX.deploy_hash]);
    });

    it("skips a transfer with an unparsable key and still returns the rest", async () => {
      const malformed = txWith(PUBLIC_KEY_TARGET_TX, {
        deploy_hash: "malformed",
        block_height: 1_000_001,
        caller_public_key: "not-a-public-key",
      });

      serve([
        txWith(OUTGOING_TX, { deploy_hash: "good-1", block_height: 1_000_002 }),
        malformed,
        txWith(OUTGOING_TX, { deploy_hash: "good-2", block_height: 1_000_000 }),
      ]);

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.tx.hash)).toEqual(["good-1", "good-2"]);
    });

    it("returns an empty page for an account with no history", async () => {
      serve([]);

      const result = await listOperations(context, INDEXER_PUBLIC_KEY, { minHeight: 0 });

      expect(result.items).toEqual([]);
      expect(result.next).toBeUndefined();
    });
  });

  describe("options", () => {
    it("walks every page of a long history, newest first, with no duplicates", async () => {
      const all = history(600);
      serve(all);

      const { items, next } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
      });

      expect(items.map(o => o.tx.hash)).toEqual(all.map(t => t.deploy_hash));
      expect(mockFetchTxsPage).toHaveBeenCalledTimes(3);
      expect(next).toBeUndefined();
    });

    it("honours minHeight and stops once a whole page falls below it", async () => {
      serve(history(600));

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 999_600,
      });

      expect(items).toHaveLength(401);
      expect(Math.min(...items.map(o => o.tx.block.height))).toBe(999_600);
      // The cutoff falls inside page 2, so page 3 is fetched to confirm the feed is spent.
      expect(mockFetchTxsPage).toHaveBeenCalledTimes(3);
    });

    it("accepts order desc, which is the indexer's native order", async () => {
      serve(history(3));

      const { items } = await listOperations(context, INDEXER_PUBLIC_KEY, {
        minHeight: 0,
        order: "desc",
      });

      expect(items.map(o => o.tx.block.height)).toEqual([1_000_000, 999_999, 999_998]);
    });

    it("raises rather than silently ignoring order asc", async () => {
      serve(history(3));

      await expect(
        listOperations(context, INDEXER_PUBLIC_KEY, { minHeight: 0, order: "asc" }),
      ).rejects.toThrow(/order "asc" is not supported/);
    });
  });

  describe("unsupported options", () => {
    it("rejects a cursor rather than emulating it by re-walking the feed", async () => {
      serve(history(30));

      await expect(
        listOperations(context, INDEXER_PUBLIC_KEY, { minHeight: 0, cursor: "deploy-0009" }),
      ).rejects.toThrow(/cursor is not supported/);
    });

    it("rejects a limit rather than silently truncating the history", async () => {
      serve(history(30));

      await expect(
        listOperations(context, INDEXER_PUBLIC_KEY, { minHeight: 0, limit: 10 }),
      ).rejects.toThrow(/limit is not supported/);
    });
  });
});

/**
 * Target forms, transfer ids, failures and non-transfer deploys are shared with `listOperations`
 * above; these cover only what the legacy bridge shape adds on top.
 */
describe("mapTxToOps", () => {
  it("folds the fee into an outgoing operation's value", () => {
    const ops = mapTxToOps(ACCOUNT_ID, INDEXER_ACCOUNT_HASH, FEES)(OUTGOING_TX);

    expect(ops).toEqual([
      {
        id: `${ACCOUNT_ID}-${OUTGOING_TX.deploy_hash}-OUT`,
        hash: OUTGOING_TX.deploy_hash,
        type: "OUT",
        value: new BigNumber("2500000000").plus(FEES),
        fee: FEES,
        blockHeight: 1,
        blockHash: null,
        hasFailed: false,
        accountId: ACCOUNT_ID,
        senders: [INDEXER_ACCOUNT_HASH],
        recipients: [OUTGOING_TX.args.target.parsed],
        date: new Date(OUTGOING_TX.timestamp),
        extra: {},
      },
    ]);
  });

  it("leaves an incoming value alone and carries the transfer id in extra", () => {
    const ops = mapTxToOps(ACCOUNT_ID, INDEXER_ACCOUNT_HASH, FEES)(INCOMING_TX);

    expect(ops).toEqual([
      expect.objectContaining({
        id: `${ACCOUNT_ID}-${INCOMING_TX.deploy_hash}-IN`,
        type: "IN",
        value: new BigNumber("12000000000"),
        senders: [COUNTERPARTY_ACCOUNT_HASH],
        recipients: [INDEXER_ACCOUNT_HASH],
        extra: { transferId: "7772882" },
      }),
    ]);
  });

  it("keeps a transfer whose args omit the id key entirely", () => {
    const noId = txWith(INCOMING_TX, {
      args: { amount: INCOMING_TX.args.amount, target: INCOMING_TX.args.target },
    });

    const ops = mapTxToOps(ACCOUNT_ID, INDEXER_ACCOUNT_HASH, FEES)(noId);

    expect(ops).toEqual([
      expect.objectContaining({
        id: `${ACCOUNT_ID}-${noId.deploy_hash}-IN`,
        type: "IN",
        extra: {},
      }),
    ]);
  });

  it("falls back to the estimated fee when the caller passes none", () => {
    const ops = mapTxToOps(ACCOUNT_ID, INDEXER_ACCOUNT_HASH)(OUTGOING_TX);

    expect(ops.map(o => o.fee)).toEqual([getEstimatedFees()]);
  });

  it("skips a deploy that is not a native transfer", () => {
    expect(mapTxToOps(ACCOUNT_ID, INDEXER_ACCOUNT_HASH, FEES)(STAKING_TX)).toEqual([]);
  });
});
