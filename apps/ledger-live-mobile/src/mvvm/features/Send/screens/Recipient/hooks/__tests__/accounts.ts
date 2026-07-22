import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export const createMockCurrency = (overrides?: Partial<CryptoCurrency>): CryptoCurrency => {
  const currency = getCryptoCurrencyById("bitcoin");
  return {
    ...currency,
    ...overrides,
  } as CryptoCurrency;
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
