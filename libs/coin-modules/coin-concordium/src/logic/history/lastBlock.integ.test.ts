import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
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

  it("returns last block info", async () => {
    const result = await lastBlock(currency);

    expect(result.hash).toBeDefined();
    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
