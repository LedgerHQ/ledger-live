import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@domain/entity-currency";
import { TokenCurrencySchema } from "@domain/entity-currency";
import { celoFeeAssets } from "./feeAssets";

const celoCurrency = {
  id: "celo",
  type: "CryptoCurrency",
  family: "celo",
  name: "Celo",
  ticker: "CELO",
  units: [{ name: "Celo", code: "CELO", magnitude: 18 }],
} as CryptoCurrency;

const usdtCurrency: TokenCurrency = {
  id: TokenCurrencySchema.shape.id.parse("celo/erc20/usdt"),
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
      id: "celo",
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

    expect(options.map(o => o.id)).toEqual(["celo", usdtSubAccount.id]);

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

    expect(options.map(o => o.id)).toEqual(["celo"]);
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

    expect(options.map(o => o.id)).toEqual(["celo"]);
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
    expect(hydratingOption.currency).toBeUndefined();
    expect(hydratingOption.balance).toBeUndefined();
  });
});
