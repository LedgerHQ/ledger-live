import { fetchLowTransactionFee } from "./fees";

const baseUrl = "https://stacks.test.invalid";

// The real SDK runs against this fetch, so the fallback trigger is checked against the error
// message the SDK actually throws, not a hand-written copy of it.
const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();

const params = {
  payload: "0xpayload",
  estimatedLength: 180,
  network: "mainnet" as const,
  client: { baseUrl, fetch: mockFetch },
};

describe("fetchLowTransactionFee", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should return the rounded low tier when the transaction fee route responds", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          estimations: [
            { fee: 100.4, fee_rate: 1 },
            { fee: 250, fee_rate: 2 },
            { fee: 500, fee_rate: 4 },
          ],
        }),
      ),
    );

    await expect(fetchLowTransactionFee(params)).resolves.toBe(100);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(`${baseUrl}/v2/fees/transaction`);
  });

  it("should fall back to the transfer fee rate when the transaction fee route is missing", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response('{"message":"no Route matched with those values"}', {
          status: 404,
          statusText: "Not Found",
        }),
      )
      .mockResolvedValueOnce(new Response("152"));

    await expect(fetchLowTransactionFee(params)).resolves.toBe(152 * 180);
    expect(mockFetch.mock.calls[1][0]).toBe(`${baseUrl}/v2/fees/transfer`);
  });

  it("should rethrow when the transaction fee route fails for another reason", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("boom", { status: 500, statusText: "Internal Server Error" }),
    );

    await expect(fetchLowTransactionFee(params)).rejects.toThrow("Response 500");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
