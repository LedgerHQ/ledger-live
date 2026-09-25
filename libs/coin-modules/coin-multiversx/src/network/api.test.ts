import network from "@ledgerhq/live-network";
import { MultiversXNetworkApi } from "./api";

jest.mock("@ledgerhq/live-network", () => {
  const fn = jest.fn();
  return { __esModule: true, default: fn };
});

describe("MultiversXNetworkApi startAt clamping", () => {
  const api = new MultiversXNetworkApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    (network as unknown as jest.Mock).mockReset();
  });

  test("getHistory clamps startAt=0 to after=1", async () => {
    // First call gets the count, 0 means no pagination loop
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

  test("getHistory stops at the API result-window limit", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({ data: [] });
    (network as unknown as jest.Mock).mockResolvedValueOnce({ data: 10_050 });

    await api.getHistory("erd1paginated", 1);

    const transactionRequests = (network as unknown as jest.Mock).mock.calls
      .map(([request]) => request.url as string)
      .filter(url => url.includes("/accounts/erd1paginated/transactions?"));

    expect(transactionRequests).toHaveLength(200);
    expect(transactionRequests.at(-1)).toContain("from=9950&size=50");
    expect(transactionRequests).not.toContain(expect.stringContaining("from=10000"));
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
