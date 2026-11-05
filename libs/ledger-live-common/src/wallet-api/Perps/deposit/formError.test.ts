import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { QuoteErrorCodes, QuotesErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import {
  getDepositBaseError,
  getDepositBuyTarget,
  getDepositFeeAccount,
  resolveDepositFormError,
  type ResolveDepositFormErrorParams,
} from "./formError";
import { findDepositParentAccount, type PerpsDepositQuote } from "./quote";

const ether = {
  type: "CryptoCurrency",
  id: "arbitrum",
  ticker: "ETH",
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
};

function mainAccount(spendableBalance: string, overrides: Partial<Account> = {}): Account {
  return {
    type: "Account",
    id: "js:2:arbitrum:0xfunding:",
    currency: ether,
    spendableBalance: new BigNumber(spendableBalance),
    ...overrides,
  } as unknown as Account;
}

const usdc = {
  type: "TokenCurrency",
  id: "arbitrum/erc20/usd_coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

const tokenAccount = {
  type: "TokenAccount",
  id: "js:2:arbitrum:0xfunding:+usd_coin",
  parentId: "js:2:arbitrum:0xfunding:",
  token: usdc,
  spendableBalance: new BigNumber("50000000"),
} as unknown as TokenAccount;

const fee = (amount: string, currencyId = "arbitrum") => ({ amount, currencyId });

function quote(overrides: Partial<PerpsDepositQuote> = {}): PerpsDepositQuote {
  return { amountTo: new BigNumber(10), quoteId: "quote-1", errors: [], ...overrides };
}

function resolve(overrides: Partial<ResolveDepositFormErrorParams> = {}) {
  return resolveDepositFormError({
    isOffline: false,
    baseError: null,
    depositAccount: tokenAccount,
    parentAccount: mainAccount("1000000"),
    depositAmount: 20,
    sentAmountAtomic: new BigNumber("20000000"),
    quoteResult: { quote: quote(), errors: [] },
    locale: "en",
    ...overrides,
  });
}

describe("getDepositBaseError", () => {
  const base = {
    depositAccount: tokenAccount,
    depositAmount: 20,
    maxAmount: 50,
    hasConversion: true,
  };

  it("lets a valid amount ask for a quote", () => {
    expect(getDepositBaseError(base)).toBeNull();
  });

  it("blocks the quote of a token deposit whose fee account is empty", () => {
    expect(getDepositBaseError({ ...base, parentAccount: mainAccount("0") })).toEqual({
      code: "notEnoughFees",
      labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
      values: { ticker: "ETH" },
    });
    expect(getDepositBaseError({ ...base, parentAccount: mainAccount("1") })).toBeNull();
  });

  it("reports an amount above the balance", () => {
    expect(getDepositBaseError({ ...base, depositAmount: 51 })?.code).toBe("insufficientBalance");
  });

  it.each([
    ["the fiat value of the balance", { maxAmount: null }],
    ["the fiat conversion of the amount", { hasConversion: false }],
  ])("reports no quote when %s is missing", (_case, overrides) => {
    expect(getDepositBaseError({ ...base, ...overrides })?.code).toBe("noQuotes");
  });

  it("stays silent until there is an account and a positive amount", () => {
    expect(getDepositBaseError({ ...base, depositAmount: 0, maxAmount: null })).toBeNull();
    expect(getDepositBaseError({ ...base, depositAccount: undefined })).toBeNull();
  });
});

describe("getDepositFeeAccount", () => {
  it("pays the fees of a token from its parent account", () => {
    const parent = mainAccount("1");
    expect(getDepositFeeAccount(tokenAccount, parent)).toBe(parent);
  });

  it("finds no fee account when the chain pays fees in another currency", () => {
    const vechain = mainAccount("1", { feesCurrency: usdc } as unknown as Partial<Account>);
    expect(getDepositFeeAccount(vechain, undefined)).toBeUndefined();
  });

  it("finds no fee account for a token without its parent", () => {
    expect(getDepositFeeAccount(tokenAccount, undefined)).toBeUndefined();
  });
});

describe("resolveDepositFormError", () => {
  it("returns no error for a valid deposit with a usable quote", () => {
    expect(resolve()).toBeNull();
  });

  describe("priority", () => {
    it("shows offline only once there is an account and an amount", () => {
      expect(resolve({ isOffline: true, depositAmount: 0 })).toBeNull();
    });

    it("shows offline before everything else", () => {
      expect(
        resolve({
          isOffline: true,
          baseError: { code: "insufficientBalance", labelKey: "x" },
          parentAccount: mainAccount("0"),
        }),
      ).toEqual({ code: "offline", labelKey: "perpsDeposit.formErrors.offline" });
    });

    it("shows insufficient balance before the fee errors", () => {
      expect(
        resolve({
          baseError: { code: "insufficientBalance", labelKey: "x" },
          parentAccount: mainAccount("0"),
        })?.code,
      ).toBe("insufficientBalance");
    });

    it("shows the fee error before the amount limits", () => {
      expect(
        resolve({
          parentAccount: mainAccount("100"),
          quoteResult: {
            quote: quote({ estimatedNetworkFee: fee("200") }),
            errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "30" }],
          },
        })?.code,
      ).toBe("notEnoughFees");
    });

    it("shows the amount limit even when it comes with noQuotes", () => {
      expect(
        resolve({
          quoteResult: {
            errors: [
              { code: QuotesErrorCodes.NO_QUOTES },
              { code: QuotesErrorCodes.AMOUNT_TOO_HIGH, maxAmount: "1000" },
            ],
          },
        }),
      ).toEqual({
        code: "amountTooHigh",
        labelKey: "perpsDeposit.formErrors.amountTooHigh",
        values: { amount: "1,000", ticker: "USDC" },
      });
    });

    it("shows the minimum amount in the funding asset", () => {
      expect(
        resolve({
          quoteResult: { errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "0.004" }] },
        })?.values,
      ).toEqual({ amount: "0.004", ticker: "USDC" });
    });
  });

  describe("network fees", () => {
    it("asks for more of the fee currency when a token deposit has an empty fee account", () => {
      expect(resolve({ parentAccount: mainAccount("0"), quoteResult: undefined })).toEqual({
        code: "notEnoughFees",
        labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
        values: { ticker: "ETH" },
      });
    });

    it("adds the approval fee to the swap fee of a token deposit, in atomic units", () => {
      const quoteResult = {
        quote: quote({ estimatedNetworkFee: fee("700"), approvalNetworkFee: fee("301") }),
        errors: [],
      };

      expect(resolve({ parentAccount: mainAccount("1001"), quoteResult })).toBeNull();
      expect(resolve({ parentAccount: mainAccount("1000"), quoteResult })).toEqual({
        code: "notEnoughFees",
        labelKey: "perpsDeposit.formErrors.notEnoughFees",
        values: { fees: "0.0000001", ticker: "ETH" },
      });
    });

    it("formats the fee in the fee unit with at most 7 decimals", () => {
      expect(
        resolve({
          parentAccount: mainAccount("0.5e18"),
          quoteResult: {
            quote: quote({ estimatedNetworkFee: fee("1234567890123456789") }),
            errors: [],
          },
        })?.values,
      ).toEqual({ fees: "1.2345679", ticker: "ETH" });
    });

    it("adds the sent amount to the fee of a native deposit", () => {
      const quoteResult = { quote: quote({ estimatedNetworkFee: fee("100") }), errors: [] };
      const native = mainAccount("1000");

      expect(
        resolve({ depositAccount: native, sentAmountAtomic: new BigNumber("900"), quoteResult }),
      ).toBeNull();
      expect(
        resolve({ depositAccount: native, sentAmountAtomic: new BigNumber("901"), quoteResult })
          ?.code,
      ).toBe("notEnoughFees");
    });

    it("obeys the quote flag as one more fee signal, with the fee of the quote", () => {
      expect(
        resolve({
          parentAccount: mainAccount("1000"),
          quoteResult: {
            quote: quote({
              estimatedNetworkFee: fee("100"),
              errors: [{ code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES }],
            }),
            errors: [],
          },
        })?.code,
      ).toBe("notEnoughFees");
    });

    it.each([
      ["the estimated fee", { estimatedNetworkFee: fee("1", "vethor") }],
      [
        "the approval fee",
        { estimatedNetworkFee: fee("1"), approvalNetworkFee: fee("1", "vethor") },
      ],
    ])("shows no quote when %s is in another currency", (_case, fees) => {
      expect(resolve({ quoteResult: { quote: quote(fees), errors: [] } })?.code).toBe("noQuotes");
    });

    it("shows the amount limit before a fee currency that cannot be resolved", () => {
      const vechain = mainAccount("1", { feesCurrency: usdc } as unknown as Partial<Account>);
      expect(
        resolve({
          depositAccount: vechain,
          quoteResult: { errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "3" }] },
        })?.code,
      ).toBe("amountTooLow");
    });

    it("formats the fee for the user locale", () => {
      expect(
        resolve({
          locale: "fr",
          parentAccount: mainAccount("0.5e18"),
          quoteResult: {
            quote: quote({ estimatedNetworkFee: fee("1500000000000000000") }),
            errors: [],
          },
        })?.values?.fees,
      ).toBe("1,5");
    });

    it("skips the quote fee check when the quote has no fee fields", () => {
      expect(
        resolve({
          depositAccount: mainAccount("1000"),
          sentAmountAtomic: new BigNumber("1000"),
          quoteResult: { quote: quote(), errors: [] },
        }),
      ).toBeNull();
    });
  });

  describe("no quotes", () => {
    it.each([
      ["a global noQuotes", { quoteResult: { errors: [{ code: QuotesErrorCodes.NO_QUOTES }] } }],
      ["an empty result", { quoteResult: { errors: [] } }],
      [
        "a missing conversion",
        { baseError: { code: "noQuotes", labelKey: "x" }, quoteResult: undefined },
      ],
      [
        "a chain that pays fees in another currency",
        {
          depositAccount: mainAccount("1", { feesCurrency: usdc } as unknown as Partial<Account>),
        },
      ],
    ] as Array<[string, Partial<ResolveDepositFormErrorParams>]>)(
      "shows no quote for %s",
      (_case, overrides) => {
        expect(resolve(overrides)?.code).toBe("noQuotes");
      },
    );

    it("waits for the quote before it reports anything from it", () => {
      expect(resolve({ quoteResult: undefined })).toBeNull();
    });
  });
});

describe("findDepositParentAccount", () => {
  it("finds the main account of a token", () => {
    const parent = mainAccount("1");
    expect(findDepositParentAccount(tokenAccount, [tokenAccount, parent])).toBe(parent);
  });

  it("finds nothing for a main account or a missing parent", () => {
    expect(findDepositParentAccount(mainAccount("1"), [])).toBeUndefined();
    expect(findDepositParentAccount(tokenAccount, [tokenAccount])).toBeUndefined();
  });
});

describe("getDepositBuyTarget", () => {
  const parentAccount = mainAccount("0");
  const getAccountName = (account: { id: string }) => `name of ${account.id}`;

  it("buys the fee currency in the fee account for a fee error", () => {
    expect(
      getDepositBuyTarget({
        statusError: { code: "notEnoughFees", labelKey: "x" },
        depositAccount: tokenAccount,
        parentAccount,
        getAccountName,
      }),
    ).toEqual({
      account: parentAccount,
      parentAccount: undefined,
      details: {
        titleKey: "perpsDeposit.details.notEnoughFees.title",
        descriptionKey: "perpsDeposit.details.notEnoughFees.description",
        values: { ticker: "ETH", account: `name of ${parentAccount.id}` },
        buyTicker: "ETH",
      },
    });
  });

  it("buys the funding asset for a minimum amount error", () => {
    expect(
      getDepositBuyTarget({
        statusError: { code: "amountTooLow", labelKey: "x", values: { amount: "12" } },
        depositAccount: tokenAccount,
        parentAccount,
        getAccountName,
      }),
    ).toMatchObject({
      account: tokenAccount,
      parentAccount,
      details: { values: { ticker: "USDC", amount: "12" }, buyTicker: "USDC" },
    });
  });

  it("offers no Buy for the other errors", () => {
    expect(
      getDepositBuyTarget({
        statusError: { code: "amountTooHigh", labelKey: "x" },
        depositAccount: tokenAccount,
        parentAccount,
        getAccountName,
      }),
    ).toBeNull();
  });
});
