import { fetchEstimatedFees } from "../../network/api";
import { getNextSequence } from "./getNextSequence";

jest.mock("../../network/api");
jest.mock("@ledgerhq/logs");

const mockedFetch = fetchEstimatedFees as jest.MockedFunction<typeof fetchEstimatedFees>;

describe("getNextSequence", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns nonce as bigint from fee estimation response", async () => {
    mockedFetch.mockResolvedValueOnce({
      gas_limit: 1_000_000,
      gas_fee_cap: "100000",
      gas_premium: "1000",
      nonce: 7,
    });

    const result = await getNextSequence("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");
    expect(result).toBe(7n);
    expect(typeof result).toBe("bigint");
  });

  it("calls fetchEstimatedFees with address as both from and to", async () => {
    mockedFetch.mockResolvedValueOnce({
      gas_limit: 0,
      gas_fee_cap: "0",
      gas_premium: "0",
      nonce: 0,
    });

    const addr = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
    await getNextSequence(addr);
    expect(mockedFetch).toHaveBeenCalledWith({ from: addr, to: addr });
  });
});
