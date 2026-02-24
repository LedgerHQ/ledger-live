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
