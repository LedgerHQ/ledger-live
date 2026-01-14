import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export const createMockCantonCurrency = (): CryptoCurrency => {
  const mockCurrency = {
    id: "canton_network",
    name: "Canton",
    type: "CryptoCurrency",
    family: "canton",
    units: [{ name: "Canton", code: "CANTON", magnitude: 38 }],
    ticker: "CANTON",
    scheme: "canton",
    color: "#000000",
    managerAppName: "Canton",
    coinType: 6767,
    explorerViews: [],
  } satisfies CryptoCurrency;
  return mockCurrency;
};

export const createMockAccount = (overrides: Partial<Account> = {}): Account => {
  const currency = createMockCantonCurrency();
  const derivationMode = "canton" as const;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runDerivationScheme(scheme, currency, { account: 0 });

  return {
    id: "js:2:canton_network:test-address:canton",
    type: "Account",
    used: true,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "test_address",
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    seedIdentifier: "test_seed",
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
    subAccounts: [],
    ...overrides,
  };
};
