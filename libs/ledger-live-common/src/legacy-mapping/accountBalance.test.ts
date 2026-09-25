import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { AccountBalanceSchema } from "@domain/entity-account-balance";
import { toAccountBalances } from "./accountBalance";

const at = new Date("2026-01-31T12:00:00.000Z");

const usdc = {
  type: "TokenAccount",
  id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
  parentId: "js:2:ethereum:0xabc:",
  token: { id: "ethereum/erc20/usd__coin" },
  balance: new BigNumber("2500000"),
  spendableBalance: new BigNumber("2500000"),
} as unknown as TokenAccount;

const ethAccount = {
  type: "Account",
  id: "js:2:ethereum:0xabc:",
  currency: { id: "ethereum" },
  balance: new BigNumber("1500000000000000000"),
  spendableBalance: new BigNumber("1400000000000000000"),
  subAccounts: [usdc],
} as unknown as Account;

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

  it("produces rows that satisfy the entity schema", () => {
    for (const balance of toAccountBalances(ethAccount, at)) {
      expect(() => AccountBalanceSchema.parse(balance)).not.toThrow();
    }
  });

  it("handles an account with no token accounts", () => {
    expect(toAccountBalances({ ...ethAccount, subAccounts: undefined }, at)).toHaveLength(1);
  });

  it("maps a token account passed on its own", () => {
    const [balance] = toAccountBalances(usdc, at);
    expect(balance.assetId).toBe("ethereum/erc20/usd__coin");
    expect(balance.parentId).toBe("js:2:ethereum:0xabc:");
  });

  it("rejects an amount that is not decimal-encoded", () => {
    const wrong = { ...ethAccount, balance: { toFixed: () => "1.5e18" } } as unknown as Account;
    expect(() => toAccountBalances(wrong, at)).toThrow(/smallest unit/);
  });
});
