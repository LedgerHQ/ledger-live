import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import network from "@ledgerhq/live-network/network";
import { getAllTransactionsByKeys } from "./fetchTransactions";

jest.mock("@ledgerhq/live-network/network");
const mockNetwork = jest.mocked(network);

const currency = getCryptoCurrencyById("cardano");

function page(hashes: string[], limit: number | string, blockHeight = 0) {
  return {
    data: { transactions: hashes.map(hash => ({ hash })), limit, blockHeight },
  } as never;
}

describe("getAllTransactionsByKeys", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards every payment key and the blockHeight floor, walks pages, returns the max blockHeight", async () => {
    mockNetwork
      .mockResolvedValueOnce(page(["a", "b"], 2, 10)) // full page -> keep going
      .mockResolvedValueOnce(page(["c"], 2, 12)); // short page -> stop

    const res = await getAllTransactionsByKeys(["k1", "k2"], 5, currency);

    expect(res.transactions.map(t => t.hash)).toEqual(["a", "b", "c"]);
    expect(res.blockHeight).toBe(12); // max across pages
    expect(mockNetwork.mock.calls[0][0]).toMatchObject({
      method: "POST",
      data: { paymentKeys: ["k1", "k2"], pageNo: 1, blockHeight: 5 },
    });
    expect(mockNetwork.mock.calls[1][0]).toMatchObject({ data: { pageNo: 2 } });
  });

  it("stops immediately when the API advertises no limit (avoids an unbounded loop)", async () => {
    mockNetwork.mockResolvedValueOnce(page(["a"], 0, 3));

    const res = await getAllTransactionsByKeys(["k"], 0, currency);

    expect(res.transactions).toHaveLength(1);
    expect(res.blockHeight).toBe(3);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("stops when the response omits limit entirely (untyped response, avoids unbounded loop)", async () => {
    mockNetwork.mockResolvedValueOnce({
      data: { transactions: [{ hash: "a" }], blockHeight: 3 },
    } as never);

    const res = await getAllTransactionsByKeys(["k"], 0, currency);

    expect(res.transactions).toHaveLength(1);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: "negative", limit: -1 },
    { label: "non-numeric string", limit: "NaN" },
  ])(
    "stops after one page when limit is non-positive or non-numeric ($label)",
    async ({ limit }) => {
      mockNetwork.mockResolvedValueOnce(page(["a"], limit, 3));

      const res = await getAllTransactionsByKeys(["k"], 0, currency);

      expect(res.transactions).toHaveLength(1);
      expect(mockNetwork).toHaveBeenCalledTimes(1);
    },
  );

  it("coerces a numeric-string limit and keeps paginating until a short page", async () => {
    mockNetwork
      .mockResolvedValueOnce(page(["a", "b"], "2", 1)) // full page (length 2 == limit "2") -> continue
      .mockResolvedValueOnce(page(["c"], "2", 2)); // short page -> stop

    const res = await getAllTransactionsByKeys(["k"], 0, currency);

    expect(res.transactions.map(t => t.hash)).toEqual(["a", "b", "c"]);
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});
