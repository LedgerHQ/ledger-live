import {
  getDefaultAccountName,
  getDefaultAccountNameForCurrencyIndex,
  normalizeName,
  validateNameEdition,
  MAX_ACCOUNT_NAME_LENGTH,
} from "../accountName";

describe(getDefaultAccountNameForCurrencyIndex.name, () => {
  it("returns currency name with 1-based index", () => {
    expect(getDefaultAccountNameForCurrencyIndex({ currency: { name: "Bitcoin" }, index: 0 })).toBe(
      "Bitcoin 1",
    );
  });
});

describe(getDefaultAccountName.name, () => {
  describe("given an Account", () => {
    it("should return the account name", () => {
      expect(
        getDefaultAccountName({
          id: "a1",
          type: "Account",
          currency: { name: "Ethereum" },
          index: 1,
        }),
      ).toEqual("Ethereum 2");
    });
  });

  describe("given a TokenAccount", () => {
    it("should return the token account name", () => {
      expect(
        getDefaultAccountName({
          id: "t1",
          type: "TokenAccount",
          token: { name: "USD Coin" },
        }),
      ).toEqual("USD Coin");
    });
  });

  it("falls back to account id when no currency or token name", () => {
    expect(getDefaultAccountName({ id: "fallback-id", type: "Other" })).toBe("fallback-id");
  });
});

describe(validateNameEdition.name, () => {
  const account = {
    id: "a1",
    type: "Account",
    currency: { name: "Bitcoin" },
    index: 0,
  };

  it("normalizes a custom name", () => {
    expect(validateNameEdition(account, "  My Wallet  ")).toBe("My Wallet");
  });

  it("uses the default account name when name is empty", () => {
    expect(validateNameEdition(account, "")).toBe("Bitcoin 1");
  });

  it("uses the default account name when name is undefined", () => {
    expect(validateNameEdition(account)).toBe("Bitcoin 1");
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
