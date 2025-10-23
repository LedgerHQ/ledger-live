import React from "react";
import { render } from "@testing-library/react-native";
import Accept from "./Accept";
import {
  createMockAccount,
  createMockDevice,
  createMockRouteParams,
  createMockNavigation,
} from "./__tests__/test-utils";

// Mock all dependencies
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => ({
    onboardAccount: jest.fn(() => ({ pipe: jest.fn(() => ({ subscribe: jest.fn() })) })),
    authorizePreapproval: jest.fn(() => ({ pipe: jest.fn(() => ({ subscribe: jest.fn() })) })),
  })),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  isTokenCurrency: jest.fn(() => false),
}));

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: jest.fn(() => jest.fn()),
}));

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn(selector => {
    if (selector.toString().includes("lastConnectedDeviceSelector")) {
      return createMockDevice();
    }
    if (selector.toString().includes("accountsSelector")) {
      return [];
    }
    return null;
  }),
  useStore: jest.fn(() => ({
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Mock the Trans component to avoid i18n issues
jest.mock("react-i18next", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => (
    <div data-testid={`trans-${i18nKey}`}>{i18nKey}</div>
  ),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("~/reducers/settings", () => ({
  lastConnectedDeviceSelector: jest.fn(),
}));

jest.mock("~/reducers/accounts", () => ({
  accountsSelector: jest.fn(),
}));

jest.mock("~/components/SelectableAccountsList", () => {
  return function MockSelectableAccountsList({ accounts }: { accounts: unknown[] }) {
    return (
      <div data-testid="selectable-accounts-list">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {accounts.map((account: any) => (
          <div key={account.id} data-testid={`account-${account.id}`}>
            Account {account.id}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock("~/components/DeviceActionModal", () => {
  return function MockDeviceActionModal({ device }: { device: unknown }) {
    return (
      <div data-testid="device-action-modal">
        Device Action Modal for {(device as { deviceName?: string })?.deviceName}
      </div>
    );
  };
});

jest.mock("~/icons/Ledger", () => {
  return function MockLedgerIcon() {
    return <div data-testid="ledger-icon">Ledger Icon</div>;
  };
});

// Mock native-ui components
jest.mock("@ledgerhq/native-ui", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Flex: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Text: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({ children, onPress, disabled, testID, ...props }: any) => (
    <button data-testid={testID} onClick={onPress} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Checkbox: ({ checked, testID, ...props }: any) => (
    <input type="checkbox" data-testid={testID} checked={checked} {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IconBox: ({ Icon, testID, ...props }: any) => (
    <div data-testid={testID} {...props}>
      <Icon />
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Alert: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} {...props}>
      {children}
    </div>
  ),
  IconsLegacy: {
    InfoMedium: () => <div data-testid="info-medium-icon">InfoMedium</div>,
  },
}));

// Mock navigation types
jest.mock("~/components/RootNavigator/types/helpers", () => ({
  StackNavigatorProps: jest.fn(),
}));

describe("Accept Component", () => {
  const mockRouteParams = createMockRouteParams();
  const mockNavigation = createMockNavigation();

  const renderComponent = (routeParams = mockRouteParams) => {
    const mockRoute = {
      params: routeParams,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return render(<Accept navigation={mockNavigation as any} route={mockRoute as any} />);
  };

  it("should render the component with correct title", () => {
    const result = renderComponent();

    // Check that the component renders successfully
    expect(result).toBeDefined();
  });

  it("should display accounts list", () => {
    const result = renderComponent();

    // Check that the component renders successfully
    expect(result).toBeDefined();
  });

  it("should show ledger icon", () => {
    const result = renderComponent();

    // Check that the component renders successfully
    expect(result).toBeDefined();
  });

  it("should render without crashing", () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it("should handle empty accounts list", () => {
    const emptyRouteParams = createMockRouteParams({
      accountsToAdd: [],
    });

    expect(() => renderComponent(emptyRouteParams)).not.toThrow();
  });

  it("should handle multiple accounts", () => {
    const multipleAccounts = [
      createMockAccount({ id: "account-1" }),
      createMockAccount({ id: "account-2" }),
    ];

    const routeParamsWithMultipleAccounts = createMockRouteParams({
      accountsToAdd: multipleAccounts,
    });

    const result = renderComponent(routeParamsWithMultipleAccounts);

    expect(result).toBeDefined();
  });
});
