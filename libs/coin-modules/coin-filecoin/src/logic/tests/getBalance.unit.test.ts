import { fetchBalances, fetchERC20TokenBalance } from "../../api/api";
import { getBalance } from "../getBalance";

jest.mock("../../api/api");
jest.mock("@ledgerhq/logs");
jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: () => ({
    findTokensByAddressInCurrency: () => [],
  }),
}));
// Mock convertAddressFilToEth so synthetic addresses can drive both code paths:
// when the address starts with "f410f" -> returns a fake ETH equivalent,
// otherwise -> throws (forcing the native-only fallback branch).
jest.mock("../../network/addresses", () => ({
  convertAddressFilToEth: (addr: string) => {
    if (addr.startsWith("f410f")) return "0x" + addr.slice(5);
    throw new Error("not convertible");
  },
}));

const mockedFetchBalances = fetchBalances as jest.MockedFunction<typeof fetchBalances>;
const mockedFetchERC20Balance = fetchERC20TokenBalance as jest.MockedFunction<
  typeof fetchERC20TokenBalance
>;

describe("getBalance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns native balance entry from API response", async () => {
    mockedFetchBalances.mockResolvedValueOnce({
      total_balance: "5000000000000000000",
      spendable_balance: "4000000000000000000",
      locked_balance: "1000000000000000000",
    });

    const result = await getBalance("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");

    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(result[0].value).toBe(5_000_000_000_000_000_000n);
    expect(result[0].locked).toBe(1_000_000_000_000_000_000n);
  });

  it("uses 0n as locked_balance fallback when field is absent", async () => {
    mockedFetchBalances.mockResolvedValueOnce({
      total_balance: "1000",
      spendable_balance: "1000",
      locked_balance: undefined as unknown as string,
    });

    const result = await getBalance("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");
    expect(result[0].locked).toBe(0n);
  });

  it("does not call fetchERC20TokenBalance when no tokens registered", async () => {
    mockedFetchBalances.mockResolvedValueOnce({
      total_balance: "0",
      spendable_balance: "0",
      locked_balance: "0",
    });

    await getBalance("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");
    expect(mockedFetchERC20Balance).not.toHaveBeenCalled();
  });

  it("returns token balance entries (lowercase assetReference) when tokenContracts provided", async () => {
    mockedFetchBalances.mockResolvedValueOnce({
      total_balance: "100",
      spendable_balance: "100",
      locked_balance: "0",
    });
    mockedFetchERC20Balance.mockResolvedValueOnce("0");
    mockedFetchERC20Balance.mockResolvedValueOnce("42");

    const result = await getBalance(
      "f410fkkld55ioe7qg24wvt7fu6pbknb56ht7ptloy",
      ["0xABCDEF", "0xDEADBEEF"],
    );

    expect(result).toHaveLength(3);
    const tokens = result.filter(b => b.asset.type === "erc20");
    expect(tokens).toHaveLength(2);
    // zero-balance entries must be included (specialized task constraint)
    expect(tokens[0].value).toBe(0n);
    expect(tokens[1].value).toBe(42n);
    // assetReference normalized to lowercase
    tokens.forEach(t => {
      expect((t.asset as { assetReference: string }).assetReference).toMatch(/^0x[a-f0-9]+$/);
    });
  });

  it("falls back to native-only when address cannot be converted to ETH form", async () => {
    mockedFetchBalances.mockResolvedValueOnce({
      total_balance: "100",
      spendable_balance: "100",
      locked_balance: "0",
    });

    // f1 SECP256K1 addresses are not convertAddressFilToEth-compatible — should fall back
    const result = await getBalance(
      "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      ["0xabcdef"],
    );

    expect(result).toHaveLength(1);
    expect(result[0].asset.type).toBe("native");
    expect(mockedFetchERC20Balance).not.toHaveBeenCalled();
  });
});
