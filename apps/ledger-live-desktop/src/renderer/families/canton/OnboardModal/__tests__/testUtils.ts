import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { CURRENCIES_LIST } from "@ledgerhq/live-common/currencies/mock";
import { OnboardStatus, AuthorizeStatus } from "@ledgerhq/coin-canton/types";

export const createMockCantonCurrency = (): CryptoCurrency => {
  const found = CURRENCIES_LIST.find(c => c.id === "canton_network");
  if (found) return found;

  const mockCurrency: Partial<CryptoCurrency> = {
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
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return mockCurrency as CryptoCurrency;
};

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
  ...overrides,
});

export const createMockAccount = (overrides: Partial<Account> = {}): Account => {
  const currency = createMockCantonCurrency();

  return {
    type: "Account",
    id: "js:2:canton_network:test-address:canton",
    seedIdentifier: "test-address",
    derivationMode: "canton",
    index: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/6767'/0'/0'/0'",
    used: false,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    ...overrides,
  };
};

export const createMockImportableAccount = (overrides: Partial<Account> = {}): Account => {
  return createMockAccount({
    id: "js:2:canton_network:imported-address:canton",
    freshAddress: "imported-address",
    used: true,
    ...overrides,
  });
};

export const createMockOnboardingResult = (
  overrides: Partial<{ partyId: string; completedAccount: Account }> = {},
) => {
  return {
    partyId: "test-party-id",
    completedAccount: createMockAccount(),
    ...overrides,
  };
};

export const createMockCantonBridge = () => ({
  onboardAccount: jest.fn(),
  authorizePreapproval: jest.fn(),
});

type ObservableValue = { error?: Error } | { status: number; account?: Account; partyId?: string };

export const createMockObservable = (values: ObservableValue[], delay: number = 0) => ({
  subscribe: jest.fn(
    ({
      next,
      complete,
      error,
    }: {
      next: (value: ObservableValue) => void;
      complete: () => void;
      error: (error: Error) => void;
    }) => {
      const timeoutId = setTimeout(() => {
        values.forEach(value => {
          if ("error" in value && value.error) {
            error(value.error);
          } else {
            next(value);
          }
        });
        if (values.length > 0 && !("error" in values[values.length - 1])) {
          complete();
        }
      }, delay);

      return {
        unsubscribe: jest.fn(() => clearTimeout(timeoutId)),
      };
    },
  ),
});

export const createMockStepProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockCantonCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount();
  const importableAccount = createMockImportableAccount();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: jest.fn((key: string) => key) as any,
    device,
    currency,
    accountName: "Canton 1",
    editedNames: {},
    creatableAccount,
    importableAccounts: [importableAccount],
    isProcessing: false,
    onboardingResult: undefined,
    onboardingStatus: OnboardStatus.INIT,
    authorizeStatus: AuthorizeStatus.INIT,
    onAddAccounts: jest.fn(),
    onAddMore: jest.fn(),
    onAuthorizePreapproval: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetry: jest.fn(),
    transitionTo: jest.fn(),
    ...overrides,
  };
};

export const createMockUserProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockCantonCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount();
  const importableAccount = createMockImportableAccount();

  return {
    currency,
    device,
    editedNames: {},
    selectedAccounts: [creatableAccount, importableAccount],
    existingAccounts: [],
    closeModal: jest.fn(),
    openModal: jest.fn(),
    addAccountsAction: jest.fn(),
    t: jest.fn((key: string) => key),
    ...overrides,
  };
};

export const mockOnboardingProgress = {
  PREPARE: { status: OnboardStatus.PREPARE },
  SIGN: { status: OnboardStatus.SIGN },
  SUBMIT: { status: OnboardStatus.SUBMIT },
  SUCCESS: {
    status: OnboardStatus.SUCCESS,
    account: createMockAccount(),
    partyId: "test-party-id",
  },
  ERROR: { error: new Error("Onboarding failed") },
};

export const mockAuthorizationProgress = {
  PREPARE: { status: AuthorizeStatus.PREPARE },
  SIGN: { status: AuthorizeStatus.SIGN },
  SUBMIT: { status: AuthorizeStatus.SUBMIT },
  SUCCESS: { status: AuthorizeStatus.SUCCESS },
  ERROR: { error: new Error("Authorization failed") },
};
