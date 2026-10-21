import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { celoFeeAssets } from "./feeAssets";

const USDT_CONTRACT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";

const celoCurrency = {
  id: "celo",
  type: "CryptoCurrency",
  family: "celo",
  name: "Celo",
  ticker: "CELO",
  units: [{ name: "Celo", code: "CELO", magnitude: 18 }],
} as CryptoCurrency;

const usdtCurrency: TokenCurrency = {
  id: TokenCurrencyIdSchema.parse("celo/erc20/usdt"),
  type: "TokenCurrency",
  parentCurrencyId: celoCurrency.id,
  tokenType: "erc20",
  contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};

function createMainAccount(overrides?: Partial<Account>): Account {
  return {
    type: "Account",
    id: "js:2:celo:abc:",
    currency: celoCurrency,
    spendableBalance: new BigNumber("2500000000000000000"), // 2.5 CELO
    subAccounts: [],
    ...overrides,
  } as unknown as Account;
}

function createUsdtSubAccount(overrides?: Partial<TokenAccount>): TokenAccount {
  return {
    type: "TokenAccount",
    id: "js:2:celo:abc:+celo%2Ferc20%2Fusdt",
    parentId: "js:2:celo:abc:",
    token: {
      ...usdtCurrency,
      contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    },
    balance: new BigNumber("10000000"), // 10 USDT (6 decimals)
    spendableBalance: new BigNumber("9000000"), // deliberately lower than balance, to prove options use spendableBalance
    ...overrides,
  } as unknown as TokenAccount;
}

describe("celoFeeAssets.getOptions", () => {
  it("returns the native CELO option first, carrying currency + balance (no formattedBalance)", () => {
    const mainAccount = createMainAccount();

    const options = celoFeeAssets.getOptions({ mainAccount, transaction: {} });

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      id: "standard",
      ticker: "CELO",
      currency: celoCurrency,
    });
    expect(options[0].balance).toBeInstanceOf(BigNumber);
    expect(options[0].balance).toEqual(mainAccount.spendableBalance);
    expect(options[0]).not.toHaveProperty("formattedBalance");
  });

  it("lists held, allowlisted tokens after the native option, each carrying currency + balance (no formattedBalance)", () => {
    const usdtSubAccount = createUsdtSubAccount();
    const mainAccount = createMainAccount({ subAccounts: [usdtSubAccount] });

    const options = celoFeeAssets.getOptions({ mainAccount, transaction: {} });

    expect(options.map(o => o.id)).toEqual(["standard", USDT_CONTRACT]);

    const tokenOption = options[1];
    expect(tokenOption.currency).toBe(usdtSubAccount.token);
    expect(tokenOption.balance).toBeInstanceOf(BigNumber);
    expect(tokenOption.balance).toEqual(usdtSubAccount.spendableBalance);
    expect(tokenOption).not.toHaveProperty("formattedBalance");
  });

  it("omits tokens with a zero balance (held-tokens-only)", () => {
    const zeroBalanceUsdt = createUsdtSubAccount({
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    });
    const mainAccount = createMainAccount({ subAccounts: [zeroBalanceUsdt] });

    const options = celoFeeAssets.getOptions({ mainAccount, transaction: {} });

    expect(options.map(o => o.id)).toEqual(["standard"]);
  });

  it("omits tokens that are not allowlisted fee currencies", () => {
    const notAllowlisted = createUsdtSubAccount({
      token: {
        ...usdtCurrency,
        id: "celo/erc20/not-allowlisted",
        contractAddress: "0x0000000000000000000000000000000000dead",
      } as TokenCurrency,
    });
    const mainAccount = createMainAccount({ subAccounts: [notAllowlisted] });

    const options = celoFeeAssets.getOptions({ mainAccount, transaction: {} });

    expect(options.map(o => o.id)).toEqual(["standard"]);
  });

  it("leaves currency/balance unset on the hydrating transient token option", () => {
    // subAccounts undefined => sub-accounts are still hydrating.
    const mainAccount = createMainAccount({ subAccounts: undefined });
    const transaction = {
      feeCurrencyAccountId: "js:2:celo:abc:+celo%2Ferc20%2Fusdt",
      feeCurrencyUnwrapped: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    };

    const options = celoFeeAssets.getOptions({ mainAccount, transaction });

    expect(options).toHaveLength(2);
    const hydratingOption = options[1];
    expect(hydratingOption.id).toBe(USDT_CONTRACT);
    expect(hydratingOption.currency).toBeUndefined();
    expect(hydratingOption.balance).toBeUndefined();
  });
});

describe("celoFeeAssets selection", () => {
  const usdtSubAccount = createUsdtSubAccount();
  const mainAccount = createMainAccount({ subAccounts: [usdtSubAccount] });

  it("selects standard when no fee currency is set", () => {
    expect(celoFeeAssets.getSelectedOptionId({ mainAccount, transaction: {} })).toBe("standard");
  });

  it("derives the selected id from the lowercased unwrapped fee currency", () => {
    const transaction = { feeCurrencyUnwrapped: USDT_CONTRACT.toUpperCase().replace("0X", "0x") };

    expect(celoFeeAssets.getSelectedOptionId({ mainAccount, transaction })).toBe(USDT_CONTRACT);
  });

  it("builds the reset patch for standard", () => {
    expect(celoFeeAssets.buildPatch("standard", { mainAccount, transaction: {} })).toEqual({
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("round-trips: a token option id patches the transaction and reads back as selected", () => {
    const patch = celoFeeAssets.buildPatch(USDT_CONTRACT, { mainAccount, transaction: {} });

    expect(patch).toEqual({
      feeCurrency: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72",
      feeCurrencyUnwrapped: USDT_CONTRACT,
      feeCurrencyAccountId: usdtSubAccount.id,
    });
    expect(celoFeeAssets.getSelectedOptionId({ mainAccount, transaction: patch })).toBe(
      USDT_CONTRACT,
    );
  });

  it("resets for an option whose token account is not held", () => {
    const noTokens = createMainAccount({ subAccounts: [] });

    expect(
      celoFeeAssets.buildPatch(USDT_CONTRACT, { mainAccount: noTokens, transaction: {} }),
    ).toEqual({ feeCurrency: null, feeCurrencyUnwrapped: null, feeCurrencyAccountId: null });
  });

  it("reconciles by resetting a selection whose token account disappeared", () => {
    const transaction = { feeCurrencyAccountId: usdtSubAccount.id };

    expect(celoFeeAssets.reconcile?.({ mainAccount, transaction })).toBeNull();
    expect(
      celoFeeAssets.reconcile?.({
        mainAccount: createMainAccount({ subAccounts: [] }),
        transaction,
      }),
    ).toEqual({ feeCurrency: null, feeCurrencyUnwrapped: null, feeCurrencyAccountId: null });
  });
});
