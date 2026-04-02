import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import i18n from "~/renderer/i18n/init";
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

export const createMockStepProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockCantonCurrency();
  const device = createMockDevice();
  const creatableAccount = createMockAccount({ used: false });
  const importableAccount = createMockImportableAccount();

  return {
    t: i18n.t.bind(i18n),
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
    error: null,
    onAddAccounts: jest.fn(),
    onAddMore: jest.fn(),
    onAuthorizePreapproval: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetryOnboardAccount: jest.fn(),
    onRetryPreapproval: jest.fn(),
    skipPreapprovalStep: false,
    transitionTo: jest.fn(),
    ...overrides,
  };
};

export const createMockUserProps = (overrides: Record<string, unknown> = {}) => {
  const currency = createMockCantonCurrency();
  const creatableAccount = createMockAccount({ used: false });
  const importableAccount = createMockImportableAccount();

  return {
    currency,
    editedNames: {},
    selectedAccounts: [creatableAccount, importableAccount],
    ...overrides,
  };
};

/** Real `CryptoCurrency` (e.g. devnet) for bridge + MSW integration tests. */
export function createCantonIntegUserProps(currency: CryptoCurrency) {
  const creatableAccount = createMockAccount({
    currency,
    used: false,
    id: `js:2:${currency.id}:creatable:canton`,
  });
  const importableAccount = createMockImportableAccount({
    currency,
    id: `js:2:${currency.id}:imported:canton`,
    freshAddress: "imported-address",
  });

  return {
    currency,
    editedNames: {},
    selectedAccounts: [creatableAccount, importableAccount],
  };
}

export function createCantonIntegModalState(device: Device) {
  return {
    devices: { currentDevice: device, devices: [device] },
    modals: { MODAL_CANTON_ONBOARD_ACCOUNT: { isOpened: true } },
  };
}
