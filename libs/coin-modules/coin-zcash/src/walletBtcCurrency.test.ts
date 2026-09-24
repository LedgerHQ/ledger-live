import { setCoinConfig } from "./config";
import { walletBtcCurrencyById } from "./walletBtcCurrency";

const explorerOf = (currencyId: string) => `https://${currencyId}.explorer.test`;

beforeAll(() =>
  setCoinConfig(currencyId => ({
    info: {
      status: { type: "active" },
      infra: { EXPLORER: explorerOf(currencyId), ZCASH_GRPC_URL: "https://zaino.test:443" },
    },
  })),
);

describe("walletBtcCurrencyById", () => {
  it("takes the explorer endpoint from the currency's own coin config", () => {
    expect(walletBtcCurrencyById("zcash")).toEqual({
      id: "zcash",
      explorerId: "zec",
      explorerEndpoint: explorerOf("zcash"),
    });
  });
});
