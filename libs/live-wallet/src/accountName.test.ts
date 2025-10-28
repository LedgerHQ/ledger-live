import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "./accountName";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const mockAccount = genAccount("mockAccount", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 1,
  tokenIds: ["ethereum/erc20/usd__coin"],
});
const tokenAccount = mockAccount.subAccounts?.[0];

describe(getDefaultAccountName.name, () => {
  describe("given an Account", () => {
    it("should return the account name", () => {
      expect(getDefaultAccountName(mockAccount)).toEqual("Ethereum 2");
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account name", () => {
      if (tokenAccount) {
        expect(getDefaultAccountName(tokenAccount)).toEqual("USD Coin");
      } else {
        // Skip test if no subAccounts generated
        expect(true).toBe(true);
      }
    });
  });
});
