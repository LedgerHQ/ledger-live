import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";

type CryptoCurrencyOverrides = Omit<Partial<CryptoCurrency>, "id"> & { id?: string };

export const createMockCurrency = (overrides?: CryptoCurrencyOverrides): CryptoCurrency => {
  const currency = getCryptoCurrencyById("bitcoin");
  return {
    ...currency,
    ...overrides,
    ...(overrides?.id !== undefined && { id: CryptoCurrencyIdSchema.parse(overrides.id) }),
  } as CryptoCurrency;
};

type TokenCurrencyOverrides = Omit<Partial<TokenCurrency>, "id"> & { id?: string };

export const createMockTokenCurrency = (overrides?: TokenCurrencyOverrides): TokenCurrency =>
  ({
    type: "TokenCurrency",
    id: TokenCurrencyIdSchema.parse("ethereum/erc20/usdt"),
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    name: "Tether USD",
    ticker: "USDT",
    disableCountervalue: false,
    units: [
      {
        name: "USDT",
        code: "USDT",
        magnitude: 6,
      },
    ],
    ...overrides,
    ...(overrides?.id !== undefined && { id: TokenCurrencyIdSchema.parse(overrides.id) }),
  }) as TokenCurrency;

type MockAccount = Omit<Account, "currency"> & { currency: CryptoCurrency };
type MockAccountOverrides = Partial<Omit<MockAccount, "currency"> & { currency: CryptoCurrency }>;

export const createMockAccount = (overrides?: MockAccountOverrides): MockAccount => {
  const account = genAccount("mock_account");
  return {
    ...account,
    id: "mock_account_id",
    freshAddress: "source_address",
    balance: new BigNumber(100000000),
    spendableBalance: new BigNumber(100000000),
    currency: createMockCurrency(),
    ...overrides,
  } as MockAccount;
};
