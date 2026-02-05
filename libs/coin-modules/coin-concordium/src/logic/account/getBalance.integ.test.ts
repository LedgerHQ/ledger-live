import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
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

  it("fetches native balance for account with funds", async () => {
    // Account with some balance on testnet
    const address = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";

    const balances = await getBalance(address, currency);

    expect(balances).toBeInstanceOf(Array);
    expect(balances.length).toBeGreaterThanOrEqual(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBeGreaterThanOrEqual(BigInt(0));
    expect(typeof balances[0].value).toBe("bigint");
  });

  it("returns 0 when address is not found or has no balance", async () => {
    // Pristine account with no transactions
    const address = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

    const result = await getBalance(address, currency);

    expect(result).toEqual([{ asset: { type: "native" }, value: BigInt(0) }]);
  });
});
