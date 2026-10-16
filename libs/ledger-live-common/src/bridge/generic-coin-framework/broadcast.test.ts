import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { genericBroadcast } from "./broadcast";
import { chainReadsFor } from "./chainReads";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";

jest.mock("./api", () => ({
  getCoinModuleApi: jest.fn(),
}));
jest.mock("./bridge", () => ({
  getBridgeApi: jest.fn(async () => ({})),
}));
jest.mock("./chainReads", () => ({
  chainReadsFor: jest.fn(),
}));
jest.mock("./networkPortfolio", () => ({ openCurrencyPortfolio: jest.fn() }));
jest.mock("./portfolio/config", () => ({ isPortfolioEnabledFor: jest.fn(() => false) }));

beforeEach(() => {
  jest.mocked(isPortfolioEnabledFor).mockReturnValue(false);
});

describe("genericBroadcast", () => {
  it("propagates errors from coin-framework", async () => {
    (getCoinModuleApi as jest.Mock).mockResolvedValue({
      broadcast: jest.fn().mockRejectedValue(new Error("Broadcast Error")),
    });

    const broadcast = genericBroadcast("network", "local");

    await expect(
      broadcast({
        signedOperation: { signature: "", operation: {} },
        account: { currency: { id: "network" } },
      } as any),
    ).rejects.toThrow("Broadcast Error");
    expect(chainReadsFor).not.toHaveBeenCalled();
  });

  it("lets the family check the signed transaction through the chain reads of its currency", async () => {
    const chain = { getNextSequence: jest.fn() };
    const rejected = new Error("nonce is too low");
    const validateTransaction = jest.fn(async () => ({ error: rejected }));
    const broadcastMock = jest.fn();
    jest.mocked(chainReadsFor).mockResolvedValue(chain as never);
    jest.mocked(getBridgeApi).mockResolvedValue({ validateTransaction });
    (getCoinModuleApi as jest.Mock).mockResolvedValue({ broadcast: broadcastMock });
    const currency = { id: "ethereum" };

    await expect(
      genericBroadcast(
        "evm",
        "local",
      )({
        signedOperation: { signature: "0xsigned", operation: {} },
        account: { currency },
      } as any),
    ).rejects.toBe(rejected);
    expect(chainReadsFor).toHaveBeenCalledWith(currency);
    expect(validateTransaction).toHaveBeenCalledWith("0xsigned", chain);
    expect(broadcastMock).not.toHaveBeenCalled();

    validateTransaction.mockResolvedValueOnce({ error: undefined } as never);
    broadcastMock.mockResolvedValueOnce("0xhash");
    await expect(
      genericBroadcast(
        "evm",
        "local",
      )({
        signedOperation: { signature: "0xsigned", operation: { id: "op" } },
        account: { currency },
      } as any),
    ).resolves.toMatchObject({ hash: "0xhash" });
  });

  describe("when the coin config of the currency enables the portfolio layer", () => {
    const currency = { id: "ethereum" };
    const broadcastTransaction = jest.fn(async () => ({ transactionId: "0xportfolio" }));
    const coinModuleBroadcast = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      jest.mocked(isPortfolioEnabledFor).mockReturnValue(true);
      jest.mocked(getBridgeApi).mockResolvedValue({});
      (getCoinModuleApi as jest.Mock).mockResolvedValue({ broadcast: coinModuleBroadcast });
      jest.mocked(openCurrencyPortfolio).mockResolvedValue({
        portfolio: { broadcastTransaction },
        network: "ethereum",
        mode: "local",
      } as never);
    });

    it("broadcasts through the side writing for the chain, with the broadcast config", async () => {
      const operation = await genericBroadcast(
        "evm",
        "local",
      )({
        signedOperation: { signature: "0xsigned", operation: { id: "op" } },
        account: { currency },
        broadcastConfig: { mevProtected: true, source: { type: "swap", name: "1inch" } },
      } as any);

      expect(isPortfolioEnabledFor).toHaveBeenCalledWith("ethereum");
      expect(openCurrencyPortfolio).toHaveBeenCalledWith(currency, "write");
      expect(broadcastTransaction).toHaveBeenCalledWith("ethereum", {
        signedTransaction: "0xsigned",
        broadcastConfig: { mevProtected: true, source: { type: "swap", name: "1inch" } },
      });
      expect(operation).toMatchObject({ hash: "0xportfolio" });
      expect(coinModuleBroadcast).not.toHaveBeenCalled();
    });

    it("sends no broadcast config when the bridge call has none", async () => {
      await genericBroadcast(
        "evm",
        "local",
      )({
        signedOperation: { signature: "0xsigned", operation: { id: "op" } },
        account: { currency },
      } as any);

      expect(broadcastTransaction).toHaveBeenCalledWith("ethereum", {
        signedTransaction: "0xsigned",
      });
    });

    it("checks the signed transaction first, through the chain reads of the currency", async () => {
      const chain = { getTransactionInfo: jest.fn() };
      const rejected = new Error("transaction is already known");
      jest.mocked(chainReadsFor).mockResolvedValue(chain as never);
      jest
        .mocked(getBridgeApi)
        .mockResolvedValue({ validateTransaction: jest.fn(async () => ({ error: rejected })) });

      await expect(
        genericBroadcast(
          "evm",
          "local",
        )({
          signedOperation: { signature: "0xsigned", operation: {} },
          account: { currency },
        } as any),
      ).rejects.toBe(rejected);
      expect(broadcastTransaction).not.toHaveBeenCalled();
    });
  });
});
