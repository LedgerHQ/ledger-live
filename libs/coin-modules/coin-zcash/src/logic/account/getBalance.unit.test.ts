import { BigNumber } from "bignumber.js";
import type { TX } from "@ledgerhq/wallet-btc/index";
import {
  computeZcashBalance,
  getBalance,
  getPrivateBalance,
  getTransparentBalance,
} from "./getBalance";
import { fetchTransparentTxs } from "../../network/explorer";

jest.mock("../../network/explorer");

const mockFetch = fetchTransparentTxs as jest.MockedFunction<typeof fetchTransparentTxs>;

describe("getTransparentBalance", () => {
  it("returns 0 when there are no utxos", () => {
    expect(getTransparentBalance(undefined)).toEqual(new BigNumber(0));
    expect(getTransparentBalance([])).toEqual(new BigNumber(0));
  });

  it("sums the value of all utxos", () => {
    const utxos = [{ value: new BigNumber(1000) }, { value: new BigNumber(2500) }];
    expect(getTransparentBalance(utxos)).toEqual(new BigNumber(3500));
  });
});

describe("getPrivateBalance", () => {
  it("returns 0 when privateInfo is missing", () => {
    expect(getPrivateBalance(undefined)).toEqual(new BigNumber(0));
    expect(getPrivateBalance(null)).toEqual(new BigNumber(0));
  });

  it("sums orchard and sapling balances", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
    };
    expect(getPrivateBalance(privateInfo)).toEqual(new BigNumber(7000));
  });
});

describe("computeZcashBalance", () => {
  it("returns the transparent balance when there is no private balance", () => {
    expect(computeZcashBalance(new BigNumber(4200), undefined)).toEqual(new BigNumber(4200));
  });

  it("returns transparent + private", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
    };
    expect(computeZcashBalance(new BigNumber(10000), privateInfo)).toEqual(new BigNumber(17000));
  });
});

describe("getBalance", () => {
  const OWN = "t1Qmwyih5F7Mw6Vts4tSnXuA2o3NgJPYNgP";
  const OTHER = "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F";

  const received = (txid: string, value: string, address = OWN, outputIndex = 0): TX =>
    ({
      id: txid,
      account: 0,
      index: 0,
      received_at: "2026-01-02T03:04:05Z",
      block: { height: 3_000_000, hash: "dd".repeat(32), time: "2026-01-02T04:00:00Z" },
      address,
      inputs: [],
      outputs: [
        {
          address,
          value,
          output_hash: txid,
          output_index: outputIndex,
          block_height: 3_000_000,
          rbf: false,
        },
      ],
    }) as TX;

  const spends = (txid: string, prevTxid: string, outputIndex = 0): TX => {
    const tx = received(txid, "0", OTHER);
    return {
      ...tx,
      inputs: [
        {
          address: OWN,
          value: "0",
          output_hash: prevTxid,
          output_index: outputIndex,
          sequence: 0xfffffffe,
        },
      ],
    } as TX;
  };

  beforeEach(() => jest.clearAllMocks());

  it("sums the outputs that no later transaction spends", async () => {
    mockFetch.mockResolvedValue({
      txs: [received("11".repeat(32), "4000"), received("22".repeat(32), "2500")],
      next: null,
    });

    await expect(getBalance(OWN)).resolves.toEqual([
      { value: 6500n, asset: { type: "native", name: "ZEC" } },
    ]);
  });

  it("drops an output a later transaction spends", async () => {
    const first = "11".repeat(32);
    mockFetch.mockResolvedValue({
      txs: [
        received(first, "4000"),
        received("22".repeat(32), "2500"),
        spends("33".repeat(32), first),
      ],
      next: null,
    });

    const [balance] = await getBalance(OWN);

    expect(balance.value).toBe(2500n);
  });

  it("ignores outputs paying another address", async () => {
    mockFetch.mockResolvedValue({
      txs: [received("11".repeat(32), "4000", OTHER)],
      next: null,
    });

    const [balance] = await getBalance(OWN);

    expect(balance.value).toBe(0n);
  });

  it("walks the whole history, page after page", async () => {
    mockFetch
      .mockResolvedValueOnce({ txs: [received("11".repeat(32), "4000")], next: "token-2" })
      .mockResolvedValueOnce({ txs: [received("22".repeat(32), "1000")], next: null });

    const [balance] = await getBalance(OWN);

    expect(balance.value).toBe(5000n);
    expect(mockFetch).toHaveBeenNthCalledWith(2, OWN, { token: "token-2" });
  });

  it("stops on a paging token that does not move", async () => {
    mockFetch.mockResolvedValue({ txs: [received("11".repeat(32), "4000")], next: null });

    const [balance] = await getBalance(OWN);

    expect(balance.value).toBe(4000n);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("refuses a unified address, whose shielded receivers it cannot see", async () => {
    await expect(getBalance("u1abcdef")).rejects.toThrow("a viewing key");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
