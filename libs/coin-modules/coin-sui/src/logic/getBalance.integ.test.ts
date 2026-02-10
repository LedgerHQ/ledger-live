import { getFullnodeUrl } from "@mysten/sui/client";
import coinConfig from "../config";
import { getBalance } from "./getBalance";

const SENDER = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

describe("getBalance", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getFullnodeUrl("testnet"),
      },
    }));
  });

  it("should fetch native SUI balance", async () => {
    const balances = await getBalance(SENDER);

    expect(balances.length).toBeGreaterThanOrEqual(1);
    expect(balances[0]).toMatchObject({
      asset: { type: "native" },
    });

    expect(typeof balances[0].value).toBe("bigint");
    expect(balances[0].value).toBeGreaterThanOrEqual(0n);
  }, 10000);

  it("should fetch token balances", async () => {
    const balances = await getBalance(SENDER);

    expect(balances.length).toBeGreaterThanOrEqual(1);

    const tokenBalances = balances.filter(balance => balance.asset.type === "token");
    tokenBalances.forEach(balance => {
      expect(balance.asset.type).toBe("token");
      if (balance.asset.type === "token") {
        expect(balance.asset.assetReference).toMatch(
          /^0x[a-fA-F0-9]+::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+$/,
        );
      }
      expect(typeof balance.value).toBe("bigint");
      expect(balance.value).toBeGreaterThanOrEqual(0n);
    });
  }, 15000);

  it("should properly parse token asset reference", async () => {
    const balances = await getBalance(SENDER);

    const usdTokens = balances.filter(
      balance =>
        balance.asset.type === "token" &&
        balance.asset.assetReference?.toLowerCase().includes("usd"),
    );

    usdTokens.forEach(balance => {
      expect(balance.asset.type).toBe("token");
      if (balance.asset.type === "token") {
        expect(balance.asset.assetReference).toMatch(/usd/);
      }
      expect(typeof balance.value).toBe("bigint");
    });
  }, 15000);
});
