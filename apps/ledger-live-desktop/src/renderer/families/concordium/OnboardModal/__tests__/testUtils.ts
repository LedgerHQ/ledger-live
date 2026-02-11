import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Account } from "@ledgerhq/types-live";

import { createMockAccount, createMockConcordiumCurrency } from "../../__tests__/testUtils";
export { createMockAccount, createMockConcordiumCurrency };

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
  ...overrides,
});

export const createMockImportableAccount = (overrides: Partial<Account> = {}): Account => {
  return createMockAccount({
    id: "js:2:concordium:imported-address:concordium",
    freshAddress: "imported-address",
    used: true,
    ...overrides,
  });
};

export const createMockOnboardingResult = (
  overrides: Partial<{ completedAccount: Account }> = {},
) => {
  return {
    completedAccount: createMockAccount(),
    ...overrides,
  };
};

export const createMockConcordiumBridge = () => ({
  pairWalletConnect: jest.fn(),
  onboardAccount: jest.fn(),
});

type ObservableValue = { error?: Error } | { status: string; account?: Account };

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
  const currency = createMockConcordiumCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount({ used: false });
  const importableAccount = createMockImportableAccount();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const createMockUserProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockConcordiumCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount({ used: false });
  const importableAccount = createMockImportableAccount();

  return {
    currency,
    device,
    editedNames: {},
    selectedAccounts: [creatableAccount, importableAccount],
    existingAccounts: [],
    closeModal: jest.fn(),
    addAccountsAction: jest.fn(),
    t: jest.fn((key: string) => key),
    ...overrides,
  };
};

export const mockPairingProgress = {
  PREPARE: { status: "PREPARE", walletConnectUri: "wc:test-uri" },
  SUCCESS: { status: "SUCCESS", sessionTopic: "test-session-topic" },
  ERROR: { error: new Error("Pairing failed") },
};

export const mockOnboardingProgress = {
  PREPARE: { status: AccountOnboardStatus.PREPARE },
  SIGN: { status: AccountOnboardStatus.SIGN },
  SUBMIT: { status: AccountOnboardStatus.SUBMIT },
  SUCCESS: {
    status: AccountOnboardStatus.SUCCESS,
    account: createMockAccount(),
  },
  ERROR: { error: new Error("Onboarding failed") },
};
