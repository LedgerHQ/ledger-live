import { getBalance } from "../getBalance";
import type { BitcoinContext } from "../../api/config";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

describe("logic/getBalance (integration)", () => {
  it("returns a well-shaped native balance for a legacy account", async () => {
    const XPUB =
      "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn";
    const balances = await getBalance(context, "bitcoin", XPUB, "44'/0'/0'");

    expect(balances).toHaveLength(1);
    expect(typeof balances[0].value).toBe("bigint");
    expect(balances[0].value >= 0n).toBe(true);
    expect(balances[0].asset).toEqual({ type: "native" });
  });

  it("syncs a large account (many derived addresses) and returns a native balance", async () => {
    const XPUB =
      "xpub6CCc6taSdhLfwHhSyrkHh1fc2CgvDAbezeM5wunWfs7tCH26ysNK8nvoyAzBTBM38NbYSFehwwnZRAYHkBB9JM3gC8eJ2n5CNJgjX7Srdse";
    const balances = await getBalance(context, "bitcoin", XPUB, "84'/0'/0'/0");

    expect(balances).toHaveLength(1);
    expect(typeof balances[0].value).toBe("bigint");
    expect(balances[0].value >= 0n).toBe(true);
    expect(balances[0].asset).toEqual({ type: "native" });
  }, 120_000);
});
