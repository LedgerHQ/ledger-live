import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../../config";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  const currency = getCryptoCurrencyById("concordium");

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 100000,
    }));
  });

  it("returns last block info", async () => {
    const result = await lastBlock(currency);

    expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
