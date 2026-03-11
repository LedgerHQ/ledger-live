import { getTicker } from "../getTicker";
import { Account, TokenAccount } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  isTokenAccount: (account: { type: string }) => account.type === "TokenAccount",
}));

describe("getTicker", () => {
  it("should return the currency ticker for an Account", () => {
    const account = {
      type: "Account",
      currency: { ticker: "ETH" },
    } as Account;

    expect(getTicker(account)).toBe("ETH");
  });

  it("should return the token ticker for a TokenAccount", () => {
    const tokenAccount = {
      type: "TokenAccount",
      token: { ticker: "USDT" },
    } as TokenAccount;

    expect(getTicker(tokenAccount)).toBe("USDT");
  });
});
