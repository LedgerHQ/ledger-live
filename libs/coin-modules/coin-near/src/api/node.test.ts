import liveNetwork from "@ledgerhq/live-network";
import { setCoinConfig } from "../config";
import { getGasPrice } from "./node";

jest.mock("@ledgerhq/live-network");

const mockedLiveNetwork = jest.mocked(liveNetwork);

describe("getGasPrice", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://mocked",
        API_NEAR_PUBLIC_NODE: "https://mocked",
        API_NEAR_INDEXER: "https://mocked",
        API_NEARBLOCKS_INDEXER: "https://mocked",
      },
    }));
  });

  afterEach(() => {
    mockedLiveNetwork.mockReset();
  });

  it("returns the gas price from the indexer stats response", async () => {
    mockedLiveNetwork.mockResolvedValueOnce({
      data: { stats: [{ gas_price: "100000000" }] },
    } as never);

    await expect(getGasPrice()).resolves.toBe("100000000");
  });

  it.each([
    ["stats is null", { stats: null }],
    ["stats is an empty array", { stats: [] }],
    ["stats entry has no gas_price", { stats: [{}] }],
    ["data is empty", {}],
  ])("throws NearGasPriceNotLoaded when %s", async (_label, data) => {
    mockedLiveNetwork.mockResolvedValueOnce({ data } as never);

    await expect(getGasPrice()).rejects.toMatchObject({ name: "NearGasPriceNotLoaded" });
  });

  it("includes the offending response payload in the error message", async () => {
    mockedLiveNetwork.mockResolvedValueOnce({ data: { stats: null } } as never);

    await expect(getGasPrice()).rejects.toThrow(JSON.stringify({ stats: null }));
  });
});
