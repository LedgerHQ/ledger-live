import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyIdSchema, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  TokenCurrencyIdSchema,
  TokenCurrencySchema,
  type TokenCurrency,
} from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

type CryptoCurrencyOverrides = Omit<Partial<CryptoCurrency>, "id"> & { id?: string };
type TokenCurrencyOverrides = Omit<Partial<TokenCurrency>, "id" | "parentCurrencyId"> & {
  id?: string;
  parentCurrencyId?: string;
};

export const createMockCurrency = (overrides?: CryptoCurrencyOverrides): CryptoCurrency => {
  const currency = getCryptoCurrencyById("bitcoin");
  const { id: rawId, ...rest } = overrides ?? {};
  const id = rawId != null ? CryptoCurrencyIdSchema.parse(rawId) : currency.id;
  return {
    ...currency,
    ...rest,
    id,
  };
};

export const createMockTokenCurrency = (overrides?: TokenCurrencyOverrides): TokenCurrency => {
  const { id: rawId, parentCurrencyId: rawParentId, tokenType, ...rest } = overrides ?? {};
  return {
    type: "TokenCurrency",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    name: "Tether USD",
    ticker: "USDT",
    disableCountervalue: false,
    units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
    ...rest,
    tokenType: tokenType ?? "erc20",
    id: TokenCurrencyIdSchema.parse(rawId ?? "ethereum/erc20/usdt"),
    parentCurrencyId: TokenCurrencySchema.shape.parentCurrencyId.parse(rawParentId ?? "ethereum"),
  };
};

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
