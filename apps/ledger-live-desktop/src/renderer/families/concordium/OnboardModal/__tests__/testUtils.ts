import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import {
  AccountOnboardStatus,
  ConcordiumAccount,
  ConcordiumResources,
} from "@ledgerhq/coin-concordium/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

import { createMockAccount, createMockConcordiumCurrency } from "../../__tests__/testUtils";
export { createMockAccount, createMockConcordiumCurrency };

// STEP_TRANSITION_TIMEOUT in OnboardModal
export const T = 1500;
export const SESSION_TOPIC = "ABCDsession-topic-rest";
export const WAIT_OPTS = { timeout: 2 * T + 500 };

export const defaultConcordiumResources: ConcordiumResources = {
  isOnboarded: false,
  credId: "",
  publicKey: "",
  identityIndex: 0,
  credNumber: 0,
  ipIdentity: 0,
};

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
  ...overrides,
});

export function createConcordiumAccount(
  currency: CryptoCurrency,
  overrides: Partial<ConcordiumAccount> = {},
): ConcordiumAccount {
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
}

export function createDefaultProps(
  currency: CryptoCurrency,
  creatableAccount: ConcordiumAccount,
  overrides: Partial<{
    editedNames: Record<string, string>;
    selectedAccounts: ConcordiumAccount[];
  }> = {},
) {
  return {
    currency,
    editedNames: {},
    selectedAccounts: [creatableAccount],
    ...overrides,
  };
}

export function createInitialState(device: Device, overrides: Record<string, unknown> = {}) {
  return {
    devices: { currentDevice: device, devices: [device] },
    accounts: [],
    modals: { MODAL_CONCORDIUM_ONBOARD_ACCOUNT: { isOpened: true } },
    ...overrides,
  };
}

export const createMockImportableAccount = (overrides: Partial<Account> = {}): Account => {
  return createMockAccount({
    id: "js:2:concordium:imported-address:concordium",
    freshAddress: "imported-address",
    used: true,
    ...overrides,
  });
};

export const createMockStepProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockConcordiumCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount({ used: false });
  const importableAccount = createMockImportableAccount();

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    t: jest.fn((key: string) => key) as any,
    device,
    currency,
    accountName: "Concordium 1",
    editedNames: {},
    creatableAccount,
    importableAccounts: [importableAccount],
    isPairing: false,
    isProcessing: false,
    onboardingResult: undefined,
    onboardingStatus: AccountOnboardStatus.INIT,
    error: null,
    confirmationCode: null,
    sessionTopic: null,
    walletConnectUri: null,
    onAddAccounts: jest.fn(),
    onCancel: jest.fn(),
    onComplete: jest.fn(),
    onCreateAccount: jest.fn(),
    onPair: jest.fn(),
    onResendCreateAccount: jest.fn(),
    transitionTo: jest.fn(),
    ...overrides,
  };
};
