/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

export type CantonOnboardResult = {
  account: Account;
  partyId: string;
};

export const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  type: "Account",
  id: "test-account-id",
  currency: {
    type: "CryptoCurrency",
    id: "canton" as any,
    name: "Canton",
    ticker: "CANTON",
    units: [],
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    color: "#000000",
    family: "canton",
    blockAvgTime: 5,
    supportsSegwit: false,
    supportsNativeSegwit: false,
    explorerViews: [],
  },
  balance: new BigNumber("0"),
  spendableBalance: new BigNumber("0"),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  blockHeight: 0,
  freshAddress: "test-address",
  freshAddressPath: "44'/60'/0'/0/0",
  swapHistory: [],
  index: 0,
  derivationMode: "",
  used: false,
  seedIdentifier: "test-seed-identifier",
  creationDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  ...overrides,
});

export const createMockCurrency = (
  overrides: Partial<CryptoOrTokenCurrency> = {},
): CryptoOrTokenCurrency =>
  ({
    type: "CryptoCurrency",
    id: "canton" as any,
    name: "Canton",
    ticker: "CANTON",
    units: [],
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    color: "#000000",
    family: "canton",
    blockAvgTime: 5,
    supportsSegwit: false,
    supportsNativeSegwit: false,
    explorerViews: [],
    ...overrides,
  }) as CryptoOrTokenCurrency;

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  deviceName: "Test Device",
  modelId: "nanoSP" as any,
  wired: false,
  ...overrides,
});

export const createMockOnboardResult = (
  overrides: Partial<CantonOnboardResult> = {},
): CantonOnboardResult => ({
  account: createMockAccount(),
  partyId: "test-party-id",
  ...overrides,
});

export const createMockRouteParams = (overrides: Record<string, unknown> = {}) => ({
  accountsToAdd: [createMockAccount()],
  currency: createMockCurrency(),
  ...overrides,
});

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  getParent: jest.fn(() => ({
    navigate: jest.fn(),
  })),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(),
  getId: jest.fn(),
  getCurrentRoute: jest.fn(),
});

export const mockViewComponent = ({ children, testID, ...props }: any) =>
  React.createElement(View, { testID, ...props }, children);

const withTypesSupport = <T extends jest.Mock>(hook: T): T & { withTypes: () => T } => {
  (hook as any).withTypes = () => hook;
  return hook as T & { withTypes: () => T };
};

export const getMockReactRedux = () => {
  const mockHoursAndMinutesOptions = { format: (date: Date) => date.toISOString() };
  return {
    useDispatch: withTypesSupport(jest.fn(() => jest.fn())),
    useSelector: withTypesSupport(
      jest.fn((selector: any) => {
        const selectorStr = selector?.toString() || "";
        if (selectorStr.includes("lastConnectedDeviceSelector")) return createMockDevice();
        if (selectorStr.includes("accountsSelector")) return [];
        if ((selector as any)?.__mockHoursAndMinutesSelector) return mockHoursAndMinutesOptions;
        return null;
      }),
    ),
    useStore: withTypesSupport(
      jest.fn(() => ({
        getState: jest.fn(() => ({})),
        dispatch: jest.fn(),
        subscribe: jest.fn(),
      })),
    ),
  };
};

export const getMockReactI18next = () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) =>
    React.createElement(View, { testID: `trans-${i18nKey}` }, i18nKey),
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: "languageDetector",
    async: false,
    detect: () => "en",
    init: () => {},
    cacheUserLanguage: () => {},
  },
});

export const getMockNativeUI = () => {
  const mockViewComponentFn = ({ children, testID, ...props }: any) =>
    React.createElement(View, { testID, ...props }, children);
  return {
    Flex: mockViewComponentFn,
    Text: mockViewComponentFn,
    Button: ({ children, onPress, testID, disabled, iconName, ...props }: any) =>
      React.createElement(
        Pressable,
        { testID, onPress: disabled ? undefined : onPress, disabled, ...props },
        React.createElement(View, {}, children),
      ),
    Checkbox: ({ checked, testID, ...props }: any) =>
      React.createElement(TextInput, { testID, value: checked ? "checked" : "", ...props }),
    IconBox: ({ Icon, testID, ...props }: any) =>
      React.createElement(View, { testID, ...props }, React.createElement(Icon)),
    Alert: mockViewComponentFn,
    IconsLegacy: {
      InfoMedium: () => React.createElement(View, { testID: "info-medium-icon" }, "InfoMedium"),
    },
  };
};

export const getMockLocale = () => ({
  useLocale: () => ({ locale: "en" }),
  LocaleProvider: ({ children }: any) => children,
});

export const getMockTouchable = () => ({
  __esModule: true,
  default: ({ onPress, testID, children }: any) =>
    React.createElement(Pressable, { testID, onPress }, children),
});

export const getMockFormatDate = () => {
  const mockHoursAndMinutesOptions = { format: (date: Date) => date.toISOString() };
  const mockSelector = jest.fn(() => mockHoursAndMinutesOptions);
  (mockSelector as any).__mockHoursAndMinutesSelector = true;
  return { hoursAndMinutesOptionsSelector: mockSelector };
};

export const getMockUseAccountUnit = () => ({
  useAccountUnit: jest.fn(() => ({ code: "CANTON", name: "Canton", magnitude: 8 })),
});
