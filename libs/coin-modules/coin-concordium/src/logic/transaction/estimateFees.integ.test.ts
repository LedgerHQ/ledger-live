import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import coinConfig from "../../config";
import { estimateFees } from "./estimateFees";

describe("estimateFees", () => {
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

  it("returns cost and energy for a simple transfer", async () => {
    const result = await estimateFees(currency, TransactionType.Transfer);

    expect(result).toBeDefined();
    expect(typeof result.cost).toBe("bigint");
    expect(typeof result.energy).toBe("bigint");
    expect(result.cost).toBeGreaterThan(BigInt(0));
    expect(result.energy).toBeGreaterThan(BigInt(0));
  });

  it("returns cost and energy for a transfer with memo", async () => {
    const memoSize = 10;
    const result = await estimateFees(currency, TransactionType.TransferWithMemo, memoSize);

    expect(result).toBeDefined();
    expect(typeof result.cost).toBe("bigint");
    expect(typeof result.energy).toBe("bigint");
    expect(result.cost).toBeGreaterThan(BigInt(0));
    expect(result.energy).toBeGreaterThan(BigInt(0));
  });

  it("transfer with memo costs more energy than simple transfer", async () => {
    const simpleResult = await estimateFees(currency, TransactionType.Transfer);
    const memoResult = await estimateFees(currency, TransactionType.TransferWithMemo, 50);

    expect(memoResult.energy).toBeGreaterThan(simpleResult.energy);
    expect(memoResult.cost).toBeGreaterThan(simpleResult.cost);
  });
});
