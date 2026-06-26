import network from "@ledgerhq/live-network";
import MultiversXApi from "./apiCalls";

jest.mock("@ledgerhq/live-network", () => {
  const fn = jest.fn();
  return { __esModule: true, default: fn };
});

describe("MultiversXApi startAt clamping", () => {
  const api = new MultiversXApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    (network as unknown as jest.Mock).mockReset();
  });

  test("getHistory clamps startAt=0 to after=1", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: 0 });

    await api.getHistory("erd1testaddress", 0);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/accounts/erd1testaddress/transactions/count?after=1"),
      }),
    );
  });

  test("getHistory uses positive startAt unchanged", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: 0 });

    await api.getHistory("erd1positive", 123);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/accounts/erd1positive/transactions/count?after=123"),
      }),
    );
  });

  test("getESDTTransactionsForAddress clamps startAt=0 to after=1", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: 0 });

    await api.getESDTTransactionsForAddress("erd1tokaddr", "TOKEN-abc", 0);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining(
          "/accounts/erd1tokaddr/transactions/count?token=TOKEN-abc&after=1",
        ),
      }),
    );
  });

  test("getESDTTransactionsForAddress uses positive startAt unchanged", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: 0 });

    await api.getESDTTransactionsForAddress("erd1tokaddr", "TOKEN-abc", 456);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining(
          "/accounts/erd1tokaddr/transactions/count?token=TOKEN-abc&after=456",
        ),
      }),
    );
  });
});

describe("MultiversXApi.getTransfers", () => {
  const api = new MultiversXApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    (network as unknown as jest.Mock).mockReset();
  });

  test("builds a single windowed request (size + order + before)", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: [] });

    await api.getTransfers("erd1addr", { size: 25, order: "desc", before: 1700000000 });

    expect(network).toHaveBeenCalledTimes(1);
    const url = (network as unknown as jest.Mock).mock.calls[0][0].url as string;
    expect(url).toContain("/accounts/erd1addr/transfers?");
    expect(url).toContain("from=0");
    expect(url).toContain("size=25");
    expect(url).toContain("order=desc");
    expect(url).toContain("before=1700000000");
    expect(url).not.toContain("after=");
  });

  test("uses `after` for ascending windows and omits `before`", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: [] });

    await api.getTransfers("erd1addr", { size: 10, order: "asc", after: 1600000000 });

    const url = (network as unknown as jest.Mock).mock.calls[0][0].url as string;
    expect(url).toContain("after=1600000000");
    expect(url).not.toContain("before=");
  });

  test("enriches fungible ESDT transfers from action.arguments.transfers", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          txHash: "esdt-tx",
          value: "0",
          action: {
            category: "esdt",
            name: "transfer",
            arguments: {
              transfers: [{ type: "FungibleESDT", token: "USDC-c76f1f", value: "1000000" }],
            },
          },
        },
      ],
    });

    const [tx] = await api.getTransfers("erd1addr", { size: 10 });

    expect(tx.transfer).toBe("esdt");
    expect(tx.tokenIdentifier).toBe("USDC-c76f1f");
    expect(tx.tokenValue).toBe("1000000");
  });

  test("leaves native transfers and tokenless (NFT) transfers unmarked", async () => {
    (network as unknown as jest.Mock).mockResolvedValueOnce({
      data: [
        { txHash: "native-tx", value: "1000000000000000000" },
        {
          txHash: "nft-tx",
          value: "0",
          action: {
            category: "esdt",
            name: "transfer",
            arguments: { transfers: [{ type: "MetaESDT" }] },
          },
        },
      ],
    });

    const [native, nft] = await api.getTransfers("erd1addr", { size: 10 });

    expect(native.transfer).toBeUndefined();
    expect(native.tokenIdentifier).toBeUndefined();
    expect(nft.transfer).toBeUndefined();
    expect(nft.tokenIdentifier).toBeUndefined();
  });
});
