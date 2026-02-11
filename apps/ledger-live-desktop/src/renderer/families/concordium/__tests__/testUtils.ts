import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { ConcordiumAccount, ConcordiumResources } from "@ledgerhq/coin-concordium/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

export const createMockConcordiumCurrency = (): CryptoCurrency => {
  const mockCurrency = {
    id: "concordium",
    name: "Concordium",
    type: "CryptoCurrency",
    family: "concordium",
    units: [
      { name: "CCD", code: "CCD", magnitude: 6 },
      { name: "microCCD", code: "µCCD", magnitude: 0 },
    ],
    ticker: "CCD",
    scheme: "concordium",
    color: "#181817",
    managerAppName: "Concordium",
    coinType: 508,
    explorerViews: [],
  } satisfies CryptoCurrency;
  return mockCurrency;
};

const defaultConcordiumResources: ConcordiumResources = {
  isOnboarded: false,
  credId: "",
  publicKey: "",
  identityIndex: 0,
  credNumber: 0,
  ipIdentity: 0,
};

export const createMockAccount = (
  overrides: Partial<ConcordiumAccount> = {},
): ConcordiumAccount => {
  const currency = createMockConcordiumCurrency();
  const derivationMode = "concordium" as const;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runDerivationScheme(scheme, currency, { account: 0 });

  return {
    id: "js:2:concordium:test-address:concordium",
    type: "Account",
    used: false,
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
    concordiumResources: defaultConcordiumResources,
    ...overrides,
  };
};
