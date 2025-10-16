import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "./accountName";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

// Initialize legacy tokens for tests
initializeLegacyTokens(addTokens);

const mockAccount = genAccount("mockAccount", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 1,
});
const tokenAccount = mockAccount.subAccounts![0];

describe(getDefaultAccountName.name, () => {
  describe("given an Account", () => {
    it("should return the account name", () => {
      expect(getDefaultAccountName(mockAccount)).toEqual("Ethereum 2");
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account name", () => {
      expect(getDefaultAccountName(tokenAccount)).toEqual("0x Project");
    });
  });
});
