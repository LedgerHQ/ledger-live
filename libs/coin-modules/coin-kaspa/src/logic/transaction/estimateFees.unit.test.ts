import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

jest.mock("./craftTransaction");

const mockCraftTransaction = jest.mocked(craftTransaction);

const INTENT = {
  intentType: "transaction" as const,
  type: "send",
  sender: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
  recipient: "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65",
  amount: 10_000_000n,
  asset: { type: "native" as const },
};

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the fee computed by crafting the intent", async () => {
    mockCraftTransaction.mockResolvedValue({ transaction: "{}", details: { fee: "2036" } });

    const result = await estimateFees(INTENT);

    expect(mockCraftTransaction).toHaveBeenCalledWith(INTENT);
    expect(result.value).toBe(2036n);
  });

  it("defaults to 0 when the crafted transaction has no fee detail", async () => {
    mockCraftTransaction.mockResolvedValue({ transaction: "{}" });

    const result = await estimateFees(INTENT);

    expect(result.value).toBe(0n);
  });

  it("propagates crafting errors (e.g. an invalid address)", async () => {
    mockCraftTransaction.mockRejectedValue(new Error("kaspa: invalid sender address"));

    await expect(estimateFees(INTENT)).rejects.toThrow("invalid sender address");
  });
});
