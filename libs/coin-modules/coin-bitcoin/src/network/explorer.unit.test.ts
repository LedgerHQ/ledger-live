jest.mock("@ledgerhq/live-network/network", () => ({ __esModule: true, default: jest.fn() }));
import network from "@ledgerhq/live-network/network";
import { explorer, explorerBaseUrl } from "./explorer";

const mockedNetwork = network as unknown as jest.Mock;
const BASE = "https://explorers.example/blockchain/v4/btc";
const client = explorer({ endpoint: "https://explorers.example", explorerId: "btc" });

beforeEach(() => mockedNetwork.mockReset());

const respond = (data: unknown) => mockedNetwork.mockResolvedValueOnce({ data });

describe("explorer", () => {
  it("builds the v4 base URL", () => {
    expect(explorerBaseUrl({ endpoint: "e", explorerId: "ltc" })).toBe("e/blockchain/v4/ltc");
    expect(client.baseUrl).toBe(BASE);
  });

  it("reads the tip", async () => {
    respond({ height: 1, hash: "h", time: "t", extra: true });
    expect(await client.getCurrentBlock()).toEqual({ height: 1, hash: "h", time: "t" });
    expect(mockedNetwork).toHaveBeenCalledWith({ method: "GET", url: `${BASE}/block/current` });
  });

  it("reads a block, or none", async () => {
    respond([{ height: 2, hash: "h2", time: "t2" }]);
    expect(await client.getBlockByHeight(2)).toEqual({ height: 2, hash: "h2", time: "t2" });
    respond([]);
    expect(await client.getBlockByHeight(3)).toBeNull();
    expect(mockedNetwork).toHaveBeenLastCalledWith({ method: "GET", url: `${BASE}/block/3` });
  });

  it("reads fees and network policy", async () => {
    respond({ "1": 2 });
    expect(await client.getFees()).toEqual({ "1": 2 });
    respond({ relay_fee: "0.00001" });
    expect(await client.getNetwork()).toEqual({ relay_fee: "0.00001" });
    expect(mockedNetwork).toHaveBeenLastCalledWith({ method: "GET", url: `${BASE}/network` });
  });

  it("reads a transaction, as hex and as UTXO view", async () => {
    respond({ hex: "00" });
    expect(await client.getTxHex("t1")).toBe("00");
    respond({ outputs: [] });
    expect(await client.getUtxoTx("t1")).toEqual({ outputs: [] });
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "GET",
      url: `${BASE}/tx/t1`,
      params: { verbosity: "Minimal" },
    });
  });

  it("pages the transactions of an address", async () => {
    respond({ data: [{ id: "a" }], token: "next" });
    expect(
      await client.getAddressTxs("addr", {
        fromHeight: 10,
        toHeight: 20,
        batchSize: 5,
        order: "ascending",
        token: "prev",
      }),
    ).toEqual({ data: [{ id: "a" }], token: "next" });
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "GET",
      url: `${BASE}/address/addr/txs`,
      params: {
        verbosity: "Minimal",
        batch_size: 5,
        from_height: 10,
        to_height: 20,
        order: "ascending",
        token: "prev",
      },
    });

    respond({});
    expect(await client.getAddressTxs("addr", {})).toEqual({ data: [], token: null });
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "GET",
      url: `${BASE}/address/addr/txs`,
      params: { verbosity: "Minimal" },
    });
  });

  it("reads the mempool of an address", async () => {
    respond([{ id: "p" }]);
    expect(await client.getAddressPendingTxs("addr", 50)).toEqual([{ id: "p" }]);
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "GET",
      url: `${BASE}/address/addr/txs/pending`,
      params: { verbosity: "Minimal", batch_size: 50 },
    });
    respond(null);
    expect(await client.getAddressPendingTxs("addr", 50)).toEqual([]);
  });

  it("broadcasts, with the source headers when given", async () => {
    respond({ result: "txid" });
    expect(await client.broadcast("hex", { type: "live-app", name: "app" })).toBe("txid");
    expect(mockedNetwork).toHaveBeenLastCalledWith({
      method: "POST",
      url: `${BASE}/tx/send`,
      data: { tx: "hex" },
      headers: { "X-Ledger-Source-Type": "live-app", "X-Ledger-Source-Name": "app" },
    });
    respond({ result: "txid2" });
    await client.broadcast("hex");
    expect(mockedNetwork).toHaveBeenLastCalledWith(expect.objectContaining({ headers: {} }));
  });
});
