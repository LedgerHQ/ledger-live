import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  let currency: CryptoCurrency;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      status: { type: "active" },
    }));
    currency = getCryptoCurrencyById("concordium");
  });

  it("returns native balance for a valid address", async () => {
    const result = await getBalance("3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G", currency);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(1);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(typeof result[0].value).toBe("bigint");
    expect(result[0].value).toBeGreaterThanOrEqual(BigInt(0));
  });
});
