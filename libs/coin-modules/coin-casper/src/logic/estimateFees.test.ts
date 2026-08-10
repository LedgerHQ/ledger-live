import type {
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { CASPER_FEES_MOTES } from "../constants";
import { chainspecToml, TEST_ADDRESSES } from "../__tests__/fixtures";
import { estimateFees, getEstimatedFees, nativeMintLaneLimitCache } from "./estimateFees";

const mockFetchChainspecToml = jest.fn<Promise<string>, []>();
const mockLog = jest.fn();

jest.mock("@ledgerhq/logs", () => ({
  log: (...args: unknown[]) => mockLog(...args),
}));

jest.mock("../network/api", () => ({
  fetchChainspecToml: () => mockFetchChainspecToml(),
}));

const nativeTransferIntent: TransactionIntent<MemoNotSupported> = {
  intentType: "transaction",
  type: "send",
  sender: TEST_ADDRESSES.SECP256K1,
  recipient: TEST_ADDRESSES.RECIPIENT_ED25519,
  amount: 3_000_000_000n,
  asset: { type: "native" },
};

beforeEach(() => {
  jest.clearAllMocks();
  nativeMintLaneLimitCache.reset();
  mockFetchChainspecToml.mockResolvedValue(chainspecToml());
});

describe("estimateFees", () => {
  it("returns the native mint lane limit for a native transfer", async () => {
    await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
      value: 100_000_000n,
      parameters: { source: "chainspec", lane: "native_mint" },
    });
  });

  it("follows the chainspec when the native mint lane limit differs from the constant", async () => {
    mockFetchChainspecToml.mockResolvedValue(chainspecToml("250_000_000"));

    await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
      value: 250_000_000n,
      parameters: { source: "chainspec", lane: "native_mint" },
    });
  });

  it("ignores customFeesParameters and options", async () => {
    await expect(
      estimateFees(nativeTransferIntent, { source: "nonsense" }, { feeOptionId: "standard" }),
    ).resolves.toEqual({
      value: 100_000_000n,
      parameters: { source: "chainspec", lane: "native_mint" },
    });
  });

  it("throws for a non-native asset", async () => {
    await expect(
      estimateFees({
        ...nativeTransferIntent,
        asset: { type: "cep18", assetReference: "0xdeadbeef" },
      }),
    ).rejects.toThrow('estimateFees is not supported for asset type "cep18"');
  });

  it("throws for a staking intent, without reaching the network", async () => {
    await expect(estimateFees({ ...nativeTransferIntent, intentType: "staking" })).rejects.toThrow(
      "estimateFees is not supported for staking transactions",
    );
    expect(mockFetchChainspecToml).not.toHaveBeenCalled();
  });

  describe("fallback", () => {
    it("falls back to CASPER_FEES_MOTES when the chainspec cannot be fetched", async () => {
      mockFetchChainspecToml.mockRejectedValue(new Error("node unreachable"));

      await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
        value: BigInt(CASPER_FEES_MOTES),
        parameters: { source: "fallback", lane: "native_mint" },
      });
    });

    it("falls back when the chainspec has no native mint lane", async () => {
      mockFetchChainspecToml.mockResolvedValue(
        "[transactions]\ninstall_upgrade_lane = [2, 1, 1]\n",
      );

      await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
        value: BigInt(CASPER_FEES_MOTES),
        parameters: { source: "fallback", lane: "native_mint" },
      });
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        "Casper chainspec has no native_mint_lane gas limit",
      );
      expect(mockLog).toHaveBeenCalledTimes(1);
    });

    it("falls back when the native mint lane limit is not an integer", async () => {
      mockFetchChainspecToml.mockResolvedValue(chainspecToml("'oops'"));

      await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
        value: BigInt(CASPER_FEES_MOTES),
        parameters: { source: "fallback", lane: "native_mint" },
      });
    });
  });

  describe("chainspec caching", () => {
    it("fetches the chainspec once for repeated estimates", async () => {
      await Promise.all([estimateFees(nativeTransferIntent), estimateFees(nativeTransferIntent)]);
      await estimateFees(nativeTransferIntent);

      expect(mockFetchChainspecToml).toHaveBeenCalledTimes(1);
    });

    it("logs a missing native mint lane once, not on every estimate", async () => {
      mockFetchChainspecToml.mockResolvedValue(
        "[transactions]\ninstall_upgrade_lane = [2, 1, 1]\n",
      );

      await estimateFees(nativeTransferIntent);
      await estimateFees(nativeTransferIntent);

      expect(mockLog).toHaveBeenCalledTimes(1);
    });

    it("retries after a failed fetch instead of caching the failure", async () => {
      mockFetchChainspecToml.mockRejectedValueOnce(new Error("node unreachable"));

      await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
        value: BigInt(CASPER_FEES_MOTES),
        parameters: { source: "fallback", lane: "native_mint" },
      });
      await expect(estimateFees(nativeTransferIntent)).resolves.toEqual({
        value: 100_000_000n,
        parameters: { source: "chainspec", lane: "native_mint" },
      });
      expect(mockFetchChainspecToml).toHaveBeenCalledTimes(2);
    });
  });
});

describe("getEstimatedFees", () => {
  it("returns the CASPER_FEES_MOTES fallback", () => {
    expect(getEstimatedFees().toFixed()).toBe(BigInt(CASPER_FEES_MOTES).toString());
  });

  it("never hits the network", () => {
    getEstimatedFees();
    expect(mockFetchChainspecToml).not.toHaveBeenCalled();
  });
});
