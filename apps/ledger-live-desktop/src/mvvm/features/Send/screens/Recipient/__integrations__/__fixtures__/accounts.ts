import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { SponsoredFeeAsset } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
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

export const TRON_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export const TRON_USDT_FEE_ASSET: SponsoredFeeAsset = {
  type: "trc20",
  assetReference: TRON_USDT_CONTRACT,
  name: "Tether USD",
  unit: { name: "USDT", code: "USDT", magnitude: 6 },
};

export const createMockTronUsdtAccount = (overrides?: Partial<TokenAccount>): TokenAccount => ({
  type: "TokenAccount",
  id: "mock_tron_usdt_account_id",
  parentId: "mock_account_id",
  token: {
    type: "TokenCurrency",
    id: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
    contractAddress: TRON_USDT_CONTRACT,
    parentCurrencyId: "tron",
    tokenType: "trc20",
    name: "Tether USD",
    ticker: "USDT",
    units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  },
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: new Date(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: emptyHistoryCache,
  swapHistory: [],
  ...overrides,
});
