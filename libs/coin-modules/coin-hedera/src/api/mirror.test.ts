import network from "@ledgerhq/live-network/network";
import { getAccountTransactions } from "./mirror";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

const makeMockResponse = (data: any): Awaited<ReturnType<typeof network>> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {
    headers: {} as any,
  },
});

describe("getAccountTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include 'account.id', 'limit=100' and 'order=desc' query params", async () => {
    mockedNetwork.mockResolvedValueOnce(
      makeMockResponse({ transactions: [], links: { next: null } }),
    );

    await getAccountTransactions("0.0.1234", null);

    const calledUrl = mockedNetwork.mock.calls[0][0].url;
    expect(calledUrl).toContain("account.id=0.0.1234");
    expect(calledUrl).toContain("limit=100");
    expect(calledUrl).toContain("order=desc");
  });

  it("should break early if no transactions are returned", async () => {
    mockedNetwork.mockResolvedValueOnce(
      makeMockResponse({
        transactions: [],
        links: { next: "/next-1" },
      }),
    );

    const result = await getAccountTransactions("0.0.1234", null);

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it("should keep fetching if links.next is present and new transactions are returned", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [{ consensus_timestamp: "1" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [{ consensus_timestamp: "2" }],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [],
          links: { next: "/next-3" },
        }),
      );

    const result = await getAccountTransactions("0.0.1234", null);

    expect(result).toHaveLength(2);
    expect(result.map(tx => tx.consensus_timestamp)).toEqual(["1", "2"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});
