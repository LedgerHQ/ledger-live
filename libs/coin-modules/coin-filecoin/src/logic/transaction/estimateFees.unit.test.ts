import { fetchEstimatedFees } from "../../network/api";
import { estimateFees } from "./estimateFees";

jest.mock("../../network/api");
jest.mock("@ledgerhq/logs");
jest.mock("../../network/addresses", () => ({
  validateAddress: (input: string) => ({
    isValid: input !== "INVALID",
    parsedAddress: { toString: () => input },
  }),
}));
jest.mock("../../erc20/tokenAccounts", () => ({
  abiEncodeTransferParams: (_recipient: string, _amount: string) => "0xencoded",
  encodeTxnParams: (_data: string) => "encoded-params",
}));

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
      intentType: "transaction" as const,
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
      intentType: "transaction" as const,
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const result = await estimateFees(intent);
    expect(result.value).toBe(100_000_000_000n);
  });

  it("throws on invalid sender address", async () => {
    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: "INVALID",
      recipient: "f1recipient",
      amount: 1_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    await expect(estimateFees(intent)).rejects.toThrow(/Invalid sender address/);
  });

  it("estimates fees for ERC-20 token intent", async () => {
    mockedFetch.mockResolvedValueOnce({
      gas_limit: 10_000_000,
      gas_fee_cap: "300000",
      gas_premium: "250000",
      nonce: 1,
    });

    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: "f1sender",
      recipient: "0xrecipient",
      amount: 5_000n,
      asset: { type: "erc20" as const, assetReference: "0xcontract" },
      useAllAmount: false,
    };

    const result = await estimateFees(intent);
    expect(result.value).toBe(3_000_000_000_000n); // 300000 * 10_000_000
    expect(result.parameters?.["gasFeeCap"]).toBe("300000");
  });

  it("throws on unsupported asset type", async () => {
    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: "f1sender",
      recipient: "f1recipient",
      amount: 1_000n,
      asset: { type: "unknown" as unknown as "native" },
      useAllAmount: false,
    };

    await expect(estimateFees(intent)).rejects.toThrow(/Unsupported asset type/);
  });
});
