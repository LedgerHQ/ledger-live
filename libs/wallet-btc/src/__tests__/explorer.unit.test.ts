jest.mock("@ledgerhq/live-network/network", () => ({ __esModule: true, default: jest.fn() }));
import network from "@ledgerhq/live-network/network";
import BitcoinLikeExplorer from "../explorer/index";
import type { Address, TX } from "../storage/types";

const mockedNetwork = network as unknown as jest.Mock;

const BASE = "https://explorers.api.live.ledger.com/blockchain/v4/btc";
const explorer = new BitcoinLikeExplorer({
  cryptoCurrency: {
    id: "bitcoin",
    explorerId: "btc",
    explorerEndpoint: "https://explorers.api.live.ledger.com",
  } as any,
});
const address = { address: "addr-a", account: 0, index: 0 } as unknown as Address;

beforeEach(() => mockedNetwork.mockReset());

describe("BitcoinLikeExplorer", () => {
  it("broadcasts a raw transaction via POST", async () => {
    mockedNetwork.mockResolvedValue({ data: { result: "txid-123" } });
    const res = await explorer.broadcast("rawhex");
    expect(res.data.result).toBe("txid-123");
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", url: `${BASE}/tx/send`, data: { tx: "rawhex" } }),
    );
  });

  it("forwards source headers on broadcast when a broadcastConfig is given", async () => {
    mockedNetwork.mockResolvedValue({ data: { result: "txid" } });
    await explorer.broadcast("rawhex", { source: { type: "type-x", name: "name-y" } } as any);
    const arg = mockedNetwork.mock.calls[0][0];
    expect(arg.headers["X-Ledger-Source-Type"]).toBe("type-x");
    expect(arg.headers["X-Ledger-Source-Name"]).toBe("name-y");
  });

  it("gets a transaction hex", async () => {
    mockedNetwork.mockResolvedValue({ data: { hex: "deadbeef" } });
    expect(await explorer.getTxHex("tx1")).toBe("deadbeef");
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: `${BASE}/tx/tx1/hex` }),
    );
  });

  it("returns the current block, or null when absent", async () => {
    mockedNetwork.mockResolvedValue({ data: { height: 500, hash: "h500", time: "t" } });
    expect(await explorer.getCurrentBlock()).toMatchObject({ height: 500, hash: "h500" });
    mockedNetwork.mockResolvedValue({ data: null });
    expect(await explorer.getCurrentBlock()).toBeNull();
  });

  it("returns a block by height, or null when the array is empty", async () => {
    mockedNetwork.mockResolvedValue({ data: [{ height: 300, hash: "h300", time: "t" }] });
    expect(await explorer.getBlockByHeight(300)).toMatchObject({ height: 300, hash: "h300" });
    mockedNetwork.mockResolvedValue({ data: [] });
    expect(await explorer.getBlockByHeight(999)).toBeNull();
  });

  it("gets fees from the /fees endpoint", async () => {
    mockedNetwork.mockResolvedValue({ data: { "2": 15 } });
    expect(await explorer.getFees()).toEqual({ "2": 15 });
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: `${BASE}/fees` }),
    );
  });

  it("gets network info from the /network endpoint", async () => {
    mockedNetwork.mockResolvedValue({ data: { relay_fee: "0.00001" } });
    expect(await explorer.getNetwork()).toEqual({ relay_fee: "0.00001" });
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: `${BASE}/network` }),
    );
  });

  it("returns a tx block height, or null when unconfirmed", async () => {
    mockedNetwork.mockResolvedValue({ data: { block: { height: 700 } } });
    expect(await explorer.getTxBlockHeight("tx1")).toBe(700);
    mockedNetwork.mockResolvedValue({ data: { block: null } });
    expect(await explorer.getTxBlockHeight("tx1")).toBeNull();
  });

  it("fetches txs and returns the pagination token", async () => {
    mockedNetwork.mockResolvedValue({ data: { data: [{ id: "tx1" }], token: "next" } });
    const res = await explorer.fetchTxs(address, { batch_size: 10 });
    expect(res.txs).toEqual([{ id: "tx1" }]);
    expect(res.nextPageToken).toBe("next");
  });

  it("fetches pending txs and hydrates them via getPendings", async () => {
    mockedNetwork.mockResolvedValue({
      data: [
        {
          id: "ptx",
          inputs: [{ sequence: 0xffffffff }],
          outputs: [{ value: "1" }],
          block: null,
        },
      ],
    });
    const pendings = await explorer.getPendings(address);
    expect(pendings).toHaveLength(1);
    // hydrated: account/index/address set from the queried address
    expect(pendings[0].address).toBe(address.address);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${BASE}/address/${address.address}/txs/pending` }),
    );
  });

  it("fetches a single utxo tx", async () => {
    mockedNetwork.mockResolvedValue({ data: { id: "tx1", outputs: [] } });
    const res = await explorer.fetchUtxoTx("tx1");
    expect(res).toEqual({ id: "tx1", outputs: [] });
    expect(mockedNetwork).toHaveBeenCalledWith(expect.objectContaining({ url: `${BASE}/tx/tx1` }));
  });

  it("fetches confirmed txs since a block height", async () => {
    mockedNetwork.mockResolvedValue({
      data: {
        data: [
          {
            id: "tx1",
            inputs: [{ sequence: 0xffffffff }],
            outputs: [{ value: "1" }],
            block: { height: 100, hash: "b", time: "t" },
          },
        ],
        token: "tok",
      },
    });
    const res = await explorer.getTxsSinceBlockheight(50, address, 100, undefined, false, null);
    expect(res.txs).toHaveLength(1);
    expect(res.txs[0].id).toBe("tx1");
    expect(res.nextPageToken).toBe("tok");
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${BASE}/address/${address.address}/txs` }),
    );
  });

  it("fetches pending txs since a block height when isPending is true", async () => {
    mockedNetwork.mockResolvedValue({ data: [] });
    const res = await explorer.getTxsSinceBlockheight(50, address, 100, undefined, true, null);
    expect(res.txs).toEqual([]);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${BASE}/address/${address.address}/txs/pending` }),
    );
  });

  it("hydrateTx cleans volatile fields and derives rbf + output block height", () => {
    const tx = {
      id: "txid",
      confirmations: 3,
      hash: "should-be-deleted",
      lock_time: 5,
      inputs: [{ sequence: 0xfffffffd, txinwitness: "w", script_signature: "s", input_index: 1 }],
      outputs: [{ script_hex: "aa", value: "1" }],
      block: { height: 123, hash: "b", time: "t" },
    } as unknown as TX;

    explorer.hydrateTx(address, tx);

    expect((tx as any).confirmations).toBeUndefined();
    expect((tx as any).hash).toBeUndefined();
    expect((tx as any).lock_time).toBeUndefined();
    expect(tx.account).toBe(address.account);
    expect(tx.index).toBe(address.index);
    expect(tx.address).toBe(address.address);
    // sequence < 0xfffffffe ⇒ RBF-enabled
    expect(tx.outputs[0].rbf).toBe(true);
    expect(tx.outputs[0].output_hash).toBe("txid");
    expect(tx.outputs[0].block_height).toBe(123);
  });
});
