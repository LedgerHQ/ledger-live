import network from "@ledgerhq/live-network";
import { hederaMirrorNode } from "./mirror";
import { getMockResponse } from "../test/fixtures/network.fixture";

jest.mock("@ledgerhq/live-network");
const mockedNetwork = jest.mocked(network);

describe("getAccountTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should include 'account.id', 'limit=100' and 'order=desc' query params", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({ transactions: [], links: { next: null } }),
    );

    await hederaMirrorNode.getAccountTransactions({ address: "0.0.1234", since: null });

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("account.id=0.0.1234");
    expect(requestUrl).toContain("limit=100");
    expect(requestUrl).toContain("order=desc");
  });

  test("should keep fetching if links.next is present", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "3" }],
          links: { next: "/next-3" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: "/next-4" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: null },
        }),
      );

    const result = await hederaMirrorNode.getAccountTransactions({
      address: "0.0.1234",
      since: null,
    });

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
      getMockResponse({
        account: "0.0.1234",
        max_automatic_token_associations: 0,
        balance: {
          balance: 1000,
          timestamp: "1749047764.000113442",
          tokens: [],
        },
      }),
    );

    const result = await hederaMirrorNode.getAccount("0.0.1234");
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
      getMockResponse({
        tokens: [
          { token_id: "0.0.1001", balance: 10 },
          { token_id: "0.0.1002", balance: 20 },
        ],
        links: { next: null },
      }),
    );

    const result = await hederaMirrorNode.getAccountTokens("0.0.1234");
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(requestUrl).toContain("/api/v1/accounts/0.0.1234/tokens");
    expect(requestUrl).toContain("limit=100");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching if links.next is present and new tokens are returned", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          tokens: [{ token_id: "0.0.1001", balance: 10 }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          tokens: [{ token_id: "0.0.1002", balance: 20 }],
          links: { next: null },
        }),
      );

    const result = await hederaMirrorNode.getAccountTokens("0.0.1234");

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });
});
