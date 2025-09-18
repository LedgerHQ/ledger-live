import network from "@ledgerhq/live-network/network";
import { getAccount, getAccountTokens, getAccountTransactions } from "./mirror";

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

  test("should include 'account.id', 'limit=100' and 'order=desc' query params", async () => {
    mockedNetwork.mockResolvedValueOnce(
      makeMockResponse({ transactions: [], links: { next: null } }),
    );

    await getAccountTransactions("0.0.1234", null);

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("account.id=0.0.1234");
    expect(requestUrl).toContain("limit=100");
    expect(requestUrl).toContain("order=desc");
  });

  test("should keep fetching if links.next is present", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [{ consensus_timestamp: "1" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [{ consensus_timestamp: "3" }],
          links: { next: "/next-3" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [],
          links: { next: "/next-4" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          transactions: [],
          links: { next: null },
        }),
      );

    const result = await getAccountTransactions("0.0.1234", null);

    expect(result).toHaveLength(2);
    expect(result.map(tx => tx.consensus_timestamp)).toEqual(["1", "3"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(5);
  });
});

describe("getAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return account data", async () => {
    mockedNetwork.mockResolvedValueOnce(
      makeMockResponse({
        account: "0.0.1234",
        max_automatic_token_associations: 0,
        balance: {
          balance: 1000,
          timestamp: "1749047764.000113442",
          tokens: [],
        },
      }),
    );

    const result = await getAccount("0.0.1234");
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.account).toEqual("0.0.1234");
    expect(requestUrl).toContain("/api/v1/accounts/0.0.1234");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all tokens if only one page is needed", async () => {
    mockedNetwork.mockResolvedValueOnce(
      makeMockResponse({
        tokens: [
          { token_id: "0.0.1001", balance: 10 },
          { token_id: "0.0.1002", balance: 20 },
        ],
        links: { next: null },
      }),
    );

    const result = await getAccountTokens("0.0.1234");
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(requestUrl).toContain("/api/v1/accounts/0.0.1234/tokens");
    expect(requestUrl).toContain("limit=100");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching if links.next is present and new tokens are returned", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        makeMockResponse({
          tokens: [{ token_id: "0.0.1001", balance: 10 }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        makeMockResponse({
          tokens: [{ token_id: "0.0.1002", balance: 20 }],
          links: { next: null },
        }),
      );

    const result = await getAccountTokens("0.0.1234");

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });
});
