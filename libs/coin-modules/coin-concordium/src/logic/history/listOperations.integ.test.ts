import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../../config";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  let currency: CryptoCurrency;
  const ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

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

  it("returns operations via proxy when minHeight is 0", async () => {
    const [operations, cursor] = await listOperations(
      ADDRESS,
      { minHeight: 0, order: "desc" },
      currency,
    );

    expect(operations).toBeInstanceOf(Array);
    expect(typeof cursor).toBe("string");

    operations.forEach(op => {
      expect(op.tx.hash).toBeDefined();
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(op.tx.date).toBeInstanceOf(Date);
      expect(typeof op.tx.fees).toBe("bigint");
      expect(["IN", "OUT"]).toContain(op.type);
      expect(typeof op.value).toBe("bigint");
      expect(op.senders.length).toBeGreaterThanOrEqual(1);
      expect(op.recipients.length).toBeGreaterThanOrEqual(1);
      expect(op.asset).toEqual({ type: "native" });
    });
  });
});
