import { fetchEstimatedFees } from "../../api/api";
import { craftTransaction } from "../craftTransaction";
import { combine } from "../combine";

jest.mock("../../api/api");
jest.mock("@ledgerhq/logs");
// Mock the iso-filecoin-backed validator so synthetic test addresses pass.
jest.mock("../../network/addresses", () => ({
  validateAddress: (input: string) => ({
    isValid: true,
    parsedAddress: { toString: () => input },
  }),
}));
// Mock iso-filecoin/message Message so we don't hit real address checksum
// validation inside serialize() — that is covered by integration tests, not units.
jest.mock("iso-filecoin/message", () => ({
  Message: class {
    version: number;
    to: string;
    from: string;
    nonce: number;
    value: string;
    gasLimit: number;
    gasFeeCap: string;
    gasPremium: string;
    method: number;
    params: string | undefined;
    constructor(msg: Record<string, unknown>) {
      this.version = (msg.version as number) ?? 0;
      this.to = msg.to as string;
      this.from = msg.from as string;
      this.nonce = msg.nonce as number;
      this.value = msg.value as string;
      this.gasLimit = msg.gasLimit as number;
      this.gasFeeCap = msg.gasFeeCap as string;
      this.gasPremium = msg.gasPremium as string;
      this.method = msg.method as number;
      this.params = msg.params as string | undefined;
    }
    serialize(): Uint8Array {
      return new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    }
  },
}));

const mockedFetch = fetchEstimatedFees as jest.MockedFunction<typeof fetchEstimatedFees>;

function mockFees() {
  mockedFetch.mockResolvedValue({
    gas_limit: 1_000_000,
    gas_fee_cap: "150000",
    gas_premium: "125000",
    nonce: 5,
  });
}

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFees();
  });

  it("native intent produces a base64 string that combine can parse", async () => {
    const intent = {
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const crafted = await craftTransaction(intent);
    expect(typeof crafted.transaction).toBe("string");

    // Round-trip: combine should produce a parseable BroadcastTransactionRequest
    const combined = combine(crafted.transaction, "c2ln");
    const parsed = JSON.parse(combined);
    expect(parsed.message.nonce).toBe(5);
    expect(parsed.message.value).toBe("1000000000000000000");
    expect(parsed.message.method).toBe(0);
  });

  it("throws on unknown asset type (no silent native fallback)", async () => {
    const intent = {
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 100n,
      asset: { type: "spl-token" as unknown as "native" },
      useAllAmount: false,
    };

    await expect(craftTransaction(intent)).rejects.toThrow(/Unsupported asset type/);
  });

  it("fetches nonce at craft time (via fetchEstimatedFees)", async () => {
    const intent = {
      type: "send" as const,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      amount: 1_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    await craftTransaction(intent);
    // fetchEstimatedFees is called at least once: once for getNextSequence, once for gas
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
