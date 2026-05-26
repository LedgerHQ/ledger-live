import { fetchDRepList } from "./getDRepList";
import network from "@ledgerhq/live-network/network";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { APIGetDRepList } from "./api-types";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = network as jest.Mock;

const mockMainnetCurrency = {
  id: "cardano",
} as CryptoCurrency;

const mockTestnetCurrency = {
  id: "cardano_testnet",
} as CryptoCurrency;

const mockDRepList: APIGetDRepList = {
  pageNo: 1,
  limit: 10,
  count: 1,
  dRepList: [
    {
      active: "2024-01-01T00:00:00.000Z",
      anchor: { url: "https://example.com", hash: "abc123" },
      deposit: "500000000",
      eActive: 450,
      hex: "226872101e7daf40ba7bffcef0e1049",
      meta: {
        givenName: "Test DRep",
        hash: "hashvalue",
        motivations: "To improve Cardano",
        objectives: "Better governance",
        paymentAddress: "addr1abc",
        qualifications: "Developer",
        references: [{ url: "https://example.com" }],
      },
      pub: "pubkeyvalue",
      registered: "2023-01-01T00:00:00.000Z",
      retired: null,
      votes: 42,
    },
  ],
};

describe("fetchDRepList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the mainnet endpoint for a mainnet currency", async () => {
    mockNetwork.mockResolvedValueOnce({ data: mockDRepList });

    await fetchDRepList(mockMainnetCurrency, "test", 1, 10);

    expect(mockNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${CARDANO_API_ENDPOINT}/v1/dRep/list`,
      params: { search: "test", pageNo: 1, limit: 10 },
    });
  });

  it("calls the testnet endpoint for a testnet currency", async () => {
    mockNetwork.mockResolvedValueOnce({ data: mockDRepList });

    await fetchDRepList(mockTestnetCurrency, "", 1, 20);

    expect(mockNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${CARDANO_TESTNET_API_ENDPOINT}/v1/dRep/list`,
      params: { search: "", pageNo: 1, limit: 20 },
    });
  });

  it("forwards search, pageNo, and limit as query parameters", async () => {
    mockNetwork.mockResolvedValueOnce({ data: mockDRepList });

    await fetchDRepList(mockMainnetCurrency, "myDRep", 3, 50);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { search: "myDRep", pageNo: 3, limit: 50 },
      }),
    );
  });

  it("returns the data from the network response", async () => {
    mockNetwork.mockResolvedValueOnce({ data: mockDRepList });

    const result = await fetchDRepList(mockMainnetCurrency, "", 1, 10);

    expect(result).toEqual(mockDRepList);
  });
});
