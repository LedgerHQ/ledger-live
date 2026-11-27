import { BlockNotFoundError, GetBlockError } from "@ledgerhq/coin-module-framework/errors";
import network from "@ledgerhq/live-network";
import {
  fetchBlockscoutBlock,
  fetchBlockscoutBlockTransactions,
  fetchBlockscoutHeadHeight,
} from "./blockscout";

jest.mock("@ledgerhq/live-network");

const mockedNetwork = jest.mocked(network);
const INDEXER_URL = "https://mock.blockscout/api/v2";
const INDEXER = { url: INDEXER_URL, maxPage: 100 };

type Request = { url: string; params?: unknown };
type Responder = (request: Request) => unknown;

/** Answers each request with what `respond` returns, or fails it when `respond` throws. */
function answerWith(respond: Responder) {
  mockedNetwork.mockImplementation(async request => {
    const { url, params } = request as Request;
    return { data: respond({ url, params }) } as Awaited<ReturnType<typeof network>>;
  });
}

const SENDER = "0xFf000000000000000000000000000000001d5eF4";
const RECEIVER = "0xFF000000000000000000000000000000003b0620";
const WFIL_CONTRACT = "0x60E1773636CF5E4A227d9AC24F20fEca034ee25A";

function rawTransaction(overrides: Record<string, unknown> = {}) {
  return {
    hash: "0xtx",
    from: { hash: SENDER },
    to: { hash: RECEIVER },
    value: "0",
    fee: { value: "365510951212" },
    status: "ok",
    transaction_types: ["contract_call"],
    ...overrides,
  };
}

const BLOCK_HASH = "0x25f5880e6b49b8eb964ac5ba0af1e15d2547fa6511057567ef53f4449c1b133d";
const BLOCK_TXS_URL = `${INDEXER_URL}/blocks/${BLOCK_HASH}/transactions`;

describe("fetchBlockscoutBlock", () => {
  beforeEach(() => jest.resetAllMocks());

  it("requests the block by height", async () => {
    const block = { height: 6558811, hash: "0xaa", parent_hash: "0xbb", timestamp: "2026-11-18" };
    mockedNetwork.mockResolvedValueOnce({ data: block } as Awaited<ReturnType<typeof network>>);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).resolves.toEqual(block);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${INDEXER_URL}/blocks/6558811`,
    });
  });

  it("requests the block by hash", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: {} } as Awaited<ReturnType<typeof network>>);

    await fetchBlockscoutBlock(INDEXER_URL, "0xaa");

    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${INDEXER_URL}/blocks/0xaa`,
    });
  });

  it("turns a 404 into a BlockNotFoundError", async () => {
    mockedNetwork.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { name: "LedgerAPI4xx", status: 404 }),
    );

    await expect(fetchBlockscoutBlock(INDEXER_URL, 2683340)).rejects.toBeInstanceOf(
      BlockNotFoundError,
    );
  });

  it("rethrows a 404 that does not come from the network layer", async () => {
    const failure = Object.assign(new Error("Not found"), { status: 404 });
    mockedNetwork.mockRejectedValueOnce(failure);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).rejects.toBe(failure);
  });

  it("rethrows any other error", async () => {
    const failure = Object.assign(new Error("Bad gateway"), { status: 502 });
    mockedNetwork.mockRejectedValueOnce(failure);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).rejects.toBe(failure);
  });
});

/** The block lists one transaction with token transfers; its transfers are `transfers` */
function answerWithTransfers(transfers: unknown[]) {
  answerWith(({ url }) => ({
    items:
      url === BLOCK_TXS_URL
        ? [rawTransaction({ transaction_types: ["token_transfer"] })]
        : transfers,
    next_page_params: null,
  }));
}

describe("fetchBlockscoutBlockTransactions", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns no transaction, and makes no other request, for an empty block", async () => {
    answerWith(() => ({ items: [], next_page_params: null }));

    await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).resolves.toEqual([]);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("turns a native transfer into a signed pair of operations and keeps the fee out of them", async () => {
    answerWith(() => ({
      items: [rawTransaction({ value: "2418951500000000000" })],
      next_page_params: null,
    }));

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx).toEqual({
      hash: "0xtx",
      failed: false,
      fees: 365510951212n,
      feesAsset: { type: "native" },
      feesPayer: SENDER,
      operations: [
        {
          type: "transfer",
          address: SENDER,
          peer: RECEIVER,
          asset: { type: "native" },
          amount: -2418951500000000000n,
        },
        {
          type: "transfer",
          address: RECEIVER,
          peer: SENDER,
          asset: { type: "native" },
          amount: 2418951500000000000n,
        },
      ],
    });
  });

  it("keeps a transaction that moves nothing, with its fee and no operation", async () => {
    answerWith(() => ({ items: [rawTransaction()], next_page_params: null }));

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx).toMatchObject({ failed: false, fees: 365510951212n, operations: [] });
  });

  it("credits the contract a funded deployment creates", async () => {
    const created = "0x1111111111111111111111111111111111111111";
    answerWith(() => ({
      items: [rawTransaction({ to: null, created_contract: { hash: created }, value: "7" })],
      next_page_params: null,
    }));

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx.operations).toEqual([
      { type: "transfer", address: SENDER, peer: created, asset: { type: "native" }, amount: -7n },
      { type: "transfer", address: created, peer: SENDER, asset: { type: "native" }, amount: 7n },
    ]);
  });

  it("gives a transaction with no recipient at all only the debit of the sender", async () => {
    answerWith(() => ({
      items: [rawTransaction({ to: null, created_contract: null, value: "7" })],
      next_page_params: null,
    }));

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx.operations).toEqual([
      { type: "transfer", address: SENDER, asset: { type: "native" }, amount: -7n },
    ]);
  });

  it("ignores an ERC-20 transfer that has no amount", async () => {
    answerWith(({ url }) =>
      url === BLOCK_TXS_URL
        ? {
            items: [rawTransaction({ transaction_types: ["token_transfer"] })],
            next_page_params: null,
          }
        : {
            items: [
              {
                block_hash: BLOCK_HASH,
                token: { address_hash: WFIL_CONTRACT },
                total: null,
                from: { hash: SENDER },
                to: { hash: RECEIVER },
              },
            ],
            next_page_params: null,
          },
    );

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx.operations).toEqual([]);
  });

  describe("without ERC-20 transfer", () => {
    const nft = (blockHash: string) => ({
      block_hash: blockHash,
      token: { address_hash: "0xnft" },
      total: null,
      from: { hash: SENDER },
      to: { hash: RECEIVER },
    });
    // The indexer filters on the token type: the NFTs only show without the filter
    const answerWithNft = (blockHash: string, unfiltered = [nft(blockHash)]) =>
      answerWith(({ url }) => ({
        items:
          url === BLOCK_TXS_URL
            ? [rawTransaction({ transaction_types: ["token_transfer"] })]
            : url.endsWith("?type=ERC-20")
              ? []
              : unfiltered,
        next_page_params: null,
      }));

    it("accepts a transaction that only moves NFTs of the block", async () => {
      answerWithNft(BLOCK_HASH);

      const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

      expect(tx.operations).toEqual([]);
    });

    it("rejects a transaction that a reorg moved to another block", async () => {
      answerWithNft("0xanotherblock");

      await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBeInstanceOf(
        GetBlockError,
      );
    });

    it("rejects a transaction that no longer emits any transfer", async () => {
      answerWithNft(BLOCK_HASH, []);

      await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBeInstanceOf(
        GetBlockError,
      );
    });
  });

  describe("when a reorg moves a transaction after the block was read", () => {
    it("rejects transfers that belong to another block", async () => {
      answerWithTransfers([
        {
          block_hash: "0xanotherblock",
          token: { address_hash: WFIL_CONTRACT },
          total: { value: "100" },
          from: { hash: SENDER },
          to: { hash: RECEIVER },
        },
      ]);

      await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBeInstanceOf(
        GetBlockError,
      );
    });

    it("rejects a transaction that is gone", async () => {
      mockedNetwork.mockImplementation(async request => {
        if ((request as Request).url !== BLOCK_TXS_URL) {
          throw Object.assign(new Error("Not found"), { name: "LedgerAPI4xx", status: 404 });
        }
        return {
          data: {
            items: [rawTransaction({ transaction_types: ["token_transfer"] })],
            next_page_params: null,
          },
        } as Awaited<ReturnType<typeof network>>;
      });

      await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBeInstanceOf(
        GetBlockError,
      );
    });

    it("rethrows any other failure of the transfers request", async () => {
      const failure = Object.assign(new Error("Bad gateway"), { status: 502 });
      mockedNetwork.mockImplementation(async request => {
        if ((request as Request).url !== BLOCK_TXS_URL) throw failure;
        return {
          data: {
            items: [rawTransaction({ transaction_types: ["token_transfer"] })],
            next_page_params: null,
          },
        } as Awaited<ReturnType<typeof network>>;
      });

      await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBe(failure);
    });
  });

  it("keeps a failed transaction for its fee only, and does not read its token transfers", async () => {
    answerWith(() => ({
      items: [
        rawTransaction({
          status: "error",
          value: "5",
          transaction_types: ["contract_call", "token_transfer"],
        }),
      ],
      next_page_params: null,
    }));

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(tx).toMatchObject({ failed: true, fees: 365510951212n, operations: [] });
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("reads the ERC-20 transfers of a transaction, filtered by the indexer", async () => {
    answerWith(({ url }) =>
      url === BLOCK_TXS_URL
        ? {
            items: [rawTransaction({ transaction_types: ["contract_call", "token_transfer"] })],
            next_page_params: null,
          }
        : {
            items: [
              {
                block_hash: BLOCK_HASH,
                token: { address_hash: WFIL_CONTRACT },
                total: { value: "100" },
                from: { hash: SENDER },
                to: { hash: RECEIVER },
              },
            ],
            next_page_params: null,
          },
    );

    const [tx] = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${INDEXER_URL}/transactions/0xtx/token-transfers?type=ERC-20`,
    });
    const asset = { type: "erc20", assetReference: WFIL_CONTRACT.toLowerCase() };
    expect(tx.operations).toEqual([
      { type: "transfer", address: SENDER, peer: RECEIVER, asset, amount: -100n },
      { type: "transfer", address: RECEIVER, peer: SENDER, asset, amount: 100n },
    ]);
  });

  it("follows the next page params until the last page", async () => {
    answerWith(({ params }) =>
      params
        ? { items: [rawTransaction({ hash: "0xsecond" })], next_page_params: null }
        : {
            items: [rawTransaction({ hash: "0xfirst" })],
            next_page_params: { index: 49, block_number: 6557524 },
          },
    );

    const txs = await fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH);

    expect(txs.map(tx => tx.hash)).toEqual(["0xfirst", "0xsecond"]);
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "GET",
      url: BLOCK_TXS_URL,
      params: { index: 49, block_number: 6557524 },
    });
  });

  it("gives up after the max number of pages of the indexer config", async () => {
    answerWith(() => ({ items: [], next_page_params: { index: 1 } }));

    await expect(
      fetchBlockscoutBlockTransactions({ url: INDEXER_URL, maxPage: 3 }, BLOCK_HASH),
    ).rejects.toBeInstanceOf(GetBlockError);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });

  it("turns a 404 into a BlockNotFoundError", async () => {
    mockedNetwork.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { name: "LedgerAPI4xx", status: 404 }),
    );

    await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBeInstanceOf(
      BlockNotFoundError,
    );
  });

  it("rethrows any other error", async () => {
    const failure = Object.assign(new Error("Bad gateway"), { status: 502 });
    mockedNetwork.mockRejectedValueOnce(failure);

    await expect(fetchBlockscoutBlockTransactions(INDEXER, BLOCK_HASH)).rejects.toBe(failure);
  });
});

describe("fetchBlockscoutHeadHeight", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns the height of the latest block", async () => {
    answerWith(({ url, params }) => {
      expect(url).toBe(`${INDEXER_URL}/blocks`);
      expect(params).toEqual({ type: "block" });
      return {
        items: [
          {
            height: 6583056,
            hash: "0x96d7",
            parent_hash: "0xc084",
            timestamp: "2026-11-27T16:48:00Z",
          },
          {
            height: 6583055,
            hash: "0xc084",
            parent_hash: "0x1a49",
            timestamp: "2026-11-27T16:47:30Z",
          },
        ],
        next_page_params: { block_number: 6583006 },
      };
    });

    await expect(fetchBlockscoutHeadHeight(INDEXER_URL)).resolves.toBe(6583056);
  });

  it("throws GetBlockError when the indexer has no block", async () => {
    answerWith(() => ({ items: [], next_page_params: null }));

    await expect(fetchBlockscoutHeadHeight(INDEXER_URL)).rejects.toBeInstanceOf(GetBlockError);
  });
});
