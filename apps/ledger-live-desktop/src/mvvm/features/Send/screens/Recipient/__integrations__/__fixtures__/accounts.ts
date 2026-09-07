import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  CryptoCurrencyIdSchema,
  type CryptoCurrency,
  getCryptoCurrencyById,
} from "@domain/entity-currency-crypto";

type CurrencyOverrides = Partial<Omit<CryptoCurrency, "id">> & { id?: string };

export const createMockCurrency = (overrides?: CurrencyOverrides): CryptoCurrency => {
  const { id, ...rest } = overrides ?? {};
  const currency = getCryptoCurrencyById(id ?? "bitcoin");
  return {
    ...currency,
    ...rest,
    ...(id !== undefined ? { id: CryptoCurrencyIdSchema.parse(id) } : {}),
  };
};

export const createMockTokenCurrency = (overrides?: Partial<TokenCurrency>): TokenCurrency =>
  ({
    type: "TokenCurrency",
    id: "ethereum/erc20/usdt",
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
    parentCurrencyId: "ethereum",
    ...overrides,
  }) as TokenCurrency;

export const createMockAccount = (overrides?: Partial<Account>): Account => {
  const account = genAccount("mock_account");
  return {
    ...account,
    id: "mock_account_id",
    freshAddress: "source_address",
    balance: new BigNumber(100000000),
    spendableBalance: new BigNumber(100000000),
    currency: createMockCurrency(),
    ...overrides,
  };
};
