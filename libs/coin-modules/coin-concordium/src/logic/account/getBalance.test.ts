import { getBalance } from "./getBalance";
import type { ConcordiumCoinConfig } from "../../types";

jest.mock("../../network/proxyClient", () => ({ getAccountBalance: jest.fn() }));

const { getAccountBalance } = jest.requireMock("../../network/proxyClient");

const CONFIG = {} as ConcordiumCoinConfig;
const ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

const entry = (tokenId: string, value: string) => ({
  token: { tokenId },
  tokenAccountState: { balance: { value, decimals: 6 } },
});

describe("api getBalance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reports the native balance", async () => {
    getAccountBalance.mockResolvedValue({ finalizedBalance: { accountAmount: "10000000" } });

    await expect(getBalance(CONFIG, ADDRESS, "concordium")).resolves.toEqual([
      { asset: { type: "native" }, value: 10000000n },
    ]);
  });

  it("reports one entry per PLT, keyed by the on-chain token id and the holder", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: {
        accountAmount: "1",
        accountTokens: [entry("t-USDT", "500000"), entry("USDR", "7")],
      },
    });

    const result = await getBalance(CONFIG, ADDRESS, "concordium");

    expect(result).toEqual([
      { asset: { type: "native" }, value: 1n },
      { asset: { type: "plt", assetReference: "t-USDT", assetOwner: ADDRESS }, value: 500000n },
      { asset: { type: "plt", assetReference: "USDR", assetOwner: ADDRESS }, value: 7n },
    ]);
  });

  it("keeps the exact case of the on-chain token id", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "0", accountTokens: [entry("t-USDT", "1")] },
    });

    const [, plt] = await getBalance(CONFIG, ADDRESS, "concordium");

    expect(plt.asset).toMatchObject({ assetReference: "t-USDT" });
  });

  it("omits a malformed token entry and still reports the native balance", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: {
        accountAmount: "1",
        accountTokens: [
          { token: null },
          {},
          { token: { tokenId: "t-USDT" }, tokenAccountState: { balance: { value: "oops" } } },
          entry("USDR", "9"),
        ],
      },
    });

    // One bad entry must not discard the native balance with it.
    await expect(getBalance(CONFIG, ADDRESS, "concordium")).resolves.toEqual([
      { asset: { type: "native" }, value: 1n },
      { asset: { type: "plt", assetReference: "USDR", assetOwner: ADDRESS }, value: 9n },
    ]);
  });

  it("reports no token balances, rather than throwing, when the response omits the list", async () => {
    getAccountBalance.mockResolvedValue({ finalizedBalance: { accountAmount: "1" } });

    await expect(getBalance(CONFIG, ADDRESS, "concordium")).resolves.toHaveLength(1);
  });

  it("does not report a PLT this account holds no entry for", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await expect(getBalance(CONFIG, ADDRESS, "concordium")).resolves.toEqual([
      { asset: { type: "native" }, value: 1n },
    ]);
  });
});
