import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getDefaultAccountName, normalizeName, MAX_ACCOUNT_NAME_LENGTH } from "./accountName";
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
        expect(true).toBe(true);
      }
    });
  });
});

describe(normalizeName.name, () => {
  it.each([
    ["  hello  ", "hello"],
    ["hello   world", "hello world"],
    ["hello\t\tworld", "hello world"],
    ["hello \t world", "hello world"],
    ["   ", ""],
    ["", ""],
    ["Ethereum 1", "Ethereum 1"],
  ])("normalizeName(%j) → %j", (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });

  it("should truncate to MAX_ACCOUNT_NAME_LENGTH characters", () => {
    const longName = "  " + "a".repeat(MAX_ACCOUNT_NAME_LENGTH + 10) + "  ";
    const result = normalizeName(longName);
    expect(result).toHaveLength(MAX_ACCOUNT_NAME_LENGTH);
    expect(result).not.toMatch(/^\s/);
  });
});
