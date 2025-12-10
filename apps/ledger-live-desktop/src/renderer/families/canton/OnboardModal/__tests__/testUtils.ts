import { AuthorizeStatus } from "@ledgerhq/coin-canton/types";
import { AccountOnboardStatus } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Account } from "@ledgerhq/types-live";

import { createMockAccount, createMockCantonCurrency } from "../../__tests__/testUtils";
export { createMockAccount, createMockCantonCurrency };

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
  ...overrides,
});

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
  const creatableAccount = createMockAccount({ used: false });
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
    onboardingStatus: AccountOnboardStatus.INIT,
    authorizeStatus: AuthorizeStatus.INIT,
    error: null,
    onAddAccounts: jest.fn(),
    onAuthorizePreapproval: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetryOnboardAccount: jest.fn(),
    onRetryPreapproval: jest.fn(),
    transitionTo: jest.fn(),
    ...overrides,
  };
};

export const createMockUserProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockCantonCurrency();
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
    openModal: jest.fn(),
    addAccountsAction: jest.fn(),
    t: jest.fn((key: string) => key),
    ...overrides,
  };
};

export const mockOnboardingProgress = {
  PREPARE: { status: AccountOnboardStatus.PREPARE },
  SIGN: { status: AccountOnboardStatus.SIGN },
  SUBMIT: { status: AccountOnboardStatus.SUBMIT },
  SUCCESS: {
    status: AccountOnboardStatus.SUCCESS,
    account: createMockAccount(),
    partyId: "test-party-id",
  },
  ERROR: { error: new Error("Onboarding failed") },
};
