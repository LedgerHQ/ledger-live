import { fetchEstimatedFees } from "../../api/api";
import { estimateFees } from "../estimateFees";

jest.mock("../../api/api");
jest.mock("@ledgerhq/logs");

const mockedFetch = fetchEstimatedFees as jest.MockedFunction<typeof fetchEstimatedFees>;

describe("estimateFees", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns value = gasFeeCap * gasLimit for native intent", async () => {
    mockedFetch.mockResolvedValueOnce({
      gas_limit: 1_000_000,
      gas_fee_cap: "150000",
      gas_premium: "125000",
      nonce: 3,
    });

    const intent = {
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const result = await estimateFees(intent);
    expect(result.value).toBe(150_000_000_000n); // 150000 * 1_000_000
    expect(result.parameters?.["gasFeeCap"]).toBe("150000");
  });

  it("returns fallback fee when fetchEstimatedFees throws", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("SimulationError"));

    const intent = {
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const result = await estimateFees(intent);
    expect(result.value).toBe(100_000n);
  });
});
