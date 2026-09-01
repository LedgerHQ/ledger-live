import { AccountBalanceSchema } from "./schema";
import { toAccountBalances, type MainAccountForBalance } from "./fromAccount";

const amount = (value: string) => ({ toFixed: () => value });
const at = new Date("2026-01-31T12:00:00.000Z");

const ethAccount: MainAccountForBalance = {
  id: "js:2:ethereum:0xabc:",
  currency: { id: "ethereum" },
  balance: amount("1500000000000000000"),
  spendableBalance: amount("1400000000000000000"),
  subAccounts: [
    {
      id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
      parentId: "js:2:ethereum:0xabc:",
      token: { id: "ethereum/erc20/usd__coin" },
      balance: amount("2500000"),
      spendableBalance: amount("2500000"),
    },
  ],
};

describe("toAccountBalances", () => {
  it("emits the main row first, then one per token account", () => {
    const [mainBalance, tokenBalance] = toAccountBalances(ethAccount, at);
    expect(mainBalance).toEqual({
      accountId: "js:2:ethereum:0xabc:",
      assetId: "ethereum",
      balance: "1500000000000000000",
      spendableBalance: "1400000000000000000",
      at: "2026-01-31T12:00:00.000Z",
    });
    expect(tokenBalance).toEqual({
      accountId: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
      assetId: "ethereum/erc20/usd__coin",
      balance: "2500000",
      spendableBalance: "2500000",
      parentId: "js:2:ethereum:0xabc:",
      at: "2026-01-31T12:00:00.000Z",
    });
  });

  it("produces rows that satisfy the schema", () => {
    for (const balance of toAccountBalances(ethAccount, at)) {
      expect(() => AccountBalanceSchema.parse(balance)).not.toThrow();
    }
  });

  it("handles an account with no token accounts", () => {
    expect(toAccountBalances({ ...ethAccount, subAccounts: undefined }, at)).toHaveLength(1);
    expect(toAccountBalances({ ...ethAccount, subAccounts: null }, at)).toHaveLength(1);
  });

  it("maps a token account passed on its own", () => {
    const [balance] = toAccountBalances(
      {
        id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fdai",
        parentId: "js:2:ethereum:0xabc:",
        token: { id: "ethereum/erc20/dai" },
        balance: amount("42"),
        spendableBalance: amount("42"),
      },
      at,
    );
    expect(balance.assetId).toBe("ethereum/erc20/dai");
    expect(balance.parentId).toBe("js:2:ethereum:0xabc:");
  });

  it("rejects an amount that is not decimal-encoded", () => {
    expect(() => toAccountBalances({ ...ethAccount, balance: amount("1.5e18") }, at)).toThrow();
  });
});
