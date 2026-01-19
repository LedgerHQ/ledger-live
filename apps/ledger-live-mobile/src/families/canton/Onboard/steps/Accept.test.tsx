/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import Accept from "./Accept";
import {
  createMockAccount,
  createMockNavigation,
  createMockRouteParams,
} from "./__tests__/test-utils";
import { UserRefusedOnDevice, LockedDeviceError, LedgerAPI4xx } from "@ledgerhq/errors";

const mockObservable = () => ({
  pipe: jest.fn(function (this: any) {
    return this;
  }),
  subscribe: jest.fn(),
});
const BridgeOnboardMock: jest.Mock = jest.fn(mockObservable);
const BridgeAuthorizeMock: jest.Mock = jest.fn(mockObservable);

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => ({
    onboardAccount: BridgeOnboardMock,
    authorizePreapproval: BridgeAuthorizeMock,
  })),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  isTokenCurrency: jest.fn(() => false),
}));

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(),
}));

jest.mock("@ledgerhq/native-ui", () => {
  const { getMockNativeUI } = jest.requireActual("./__tests__/test-utils");
  return getMockNativeUI();
});

jest.mock("react-i18next", () => {
  const { getMockReactI18next } = jest.requireActual("./__tests__/test-utils");
  return getMockReactI18next();
});

jest.mock("react-redux", () => {
  const { getMockReactRedux } = jest.requireActual("./__tests__/test-utils");
  return getMockReactRedux();
});

jest.mock("~/components/DeviceActionModal", () => {
  return {
    __esModule: true,
    default: ({ device }: { device: unknown }) => (
      <View testID="device-action-modal">
        Device Action Modal for {(device as { deviceName?: string })?.deviceName}
      </View>
    ),
  };
});

jest.mock("~/components/RootNavigator/types/helpers", () => ({ StackNavigatorProps: jest.fn() }));

jest.mock("~/components/SelectableAccountsList", () => {
  return {
    __esModule: true,
    default: ({ accounts }: { accounts: unknown[] }) => (
      <View testID="selectable-accounts-list">
        {accounts.map((account: any) => (
          <View key={account.id} testID={`account-${account.id}`}>
            Account {account.id}
          </View>
        ))}
      </View>
    ),
  };
});

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: jest.fn(() => jest.fn()),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: jest.fn(() => ({ enabled: false })),
}));

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: jest.fn(() => (url: string) => url),
}));

jest.mock("~/icons/Ledger", () => {
  return {
    __esModule: true,
    default: () => <View testID="ledger-icon">Ledger Icon</View>,
  };
});

jest.mock("~/reducers/accounts", () => ({ accountsSelector: jest.fn() }));

jest.mock("~/reducers/settings", () => ({ lastConnectedDeviceSelector: jest.fn() }));

jest.mock("../../utils/navigationSnapshot", () => ({ restoreNavigationSnapshot: jest.fn() }));

const createMockOnboardObservable = (error: Error) => ({
  pipe: jest.fn(function (this: any) {
    return this;
  }),
  subscribe: jest.fn(({ error: errorHandler }: any) => {
    errorHandler(error);
    return { unsubscribe: jest.fn() };
  }),
});

describe("Accept Component", () => {
  const mockRouteParams = createMockRouteParams();
  const mockNavigation = createMockNavigation();

  const renderComponent = (routeParams = mockRouteParams) => {
    const mockRoute = {
      params: routeParams,
    };

    return render(<Accept navigation={mockNavigation as any} route={mockRoute as any} />);
  };

  it("should render without crashing", () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it("should handle empty accounts list", () => {
    const routeParams = createMockRouteParams({ accountsToAdd: [] });
    expect(() => renderComponent(routeParams)).not.toThrow();
  });

  it("should display multiple accounts", () => {
    const accounts = [
      createMockAccount({ id: "account-1" }),
      createMockAccount({ id: "account-2" }),
    ];
    const routeParams = createMockRouteParams({ accountsToAdd: accounts });
    const { getByTestId } = renderComponent(routeParams);

    expect(getByTestId("account-account-1")).toBeDefined();
    expect(getByTestId("account-account-2")).toBeDefined();
  });

  describe("translation keys", () => {
    const reonboardAccount = createMockAccount({ id: "reonboard-account" });

    test.each([
      ["title", "canton.onboard.reonboard.title", "canton.onboard.title"],
      ["account", "canton.onboard.reonboard.account", "canton.onboard.account"],
      ["authorize", "canton.onboard.reonboard.authorize", "canton.onboard.authorize"],
    ])(
      "should display %s translation key based on isReonboarding",
      (_, reonboardKey, normalKey) => {
        const reonboardParams = createMockRouteParams({
          isReonboarding: true,
          accountToReonboard: reonboardAccount,
        });
        const normalParams = createMockRouteParams({ isReonboarding: false });

        const { getByTestId: getReonboard } = renderComponent(reonboardParams);
        const { getByTestId: getNormal } = renderComponent(normalParams);

        expect(getReonboard(`trans-${reonboardKey}`)).toBeDefined();
        expect(getNormal(`trans-${normalKey}`)).toBeDefined();
      },
    );

    it("should display warning only when reonboarding", () => {
      const reonboardParams = createMockRouteParams({
        isReonboarding: true,
        accountToReonboard: reonboardAccount,
      });
      const normalParams = createMockRouteParams({
        isReonboarding: false,
      });

      const reonboardRender = renderComponent(reonboardParams);
      const normalRender = renderComponent(normalParams);

      const reonboardOutput = JSON.stringify(reonboardRender.toJSON());
      const normalOutput = JSON.stringify(normalRender.toJSON());

      expect(reonboardOutput).toContain("canton.onboard.reonboard.warning.title");
      expect(reonboardOutput).toContain("canton.onboard.reonboard.warning.description");
      expect(normalOutput).not.toContain("canton.onboard.reonboard.warning.title");
      expect(normalOutput).not.toContain("canton.onboard.reonboard.warning.description");
    });
  });

  it("should show accountToReonboard when reonboarding", () => {
    const reonboardAccount = createMockAccount({ id: "reonboard-account" });
    const otherAccount = createMockAccount({ id: "other-account" });
    const routeParams = createMockRouteParams({
      isReonboarding: true,
      accountToReonboard: reonboardAccount,
      accountsToAdd: [otherAccount],
    });
    const { getByTestId, queryByTestId } = renderComponent(routeParams);

    expect(getByTestId("account-reonboard-account")).toBeDefined();
    expect(queryByTestId("account-other-account")).toBeNull();
  });

  it("should show accountsToAdd when not reonboarding", () => {
    const account1 = createMockAccount({ id: "account-1" });
    const account2 = createMockAccount({ id: "account-2" });
    const routeParams = createMockRouteParams({
      isReonboarding: false,
      accountsToAdd: [account1, account2],
      accountToReonboard: createMockAccount({ id: "should-not-appear" }),
    });
    const { getByTestId, queryByTestId } = renderComponent(routeParams);

    expect(getByTestId("account-account-1")).toBeDefined();
    expect(getByTestId("account-account-2")).toBeDefined();
    expect(queryByTestId("account-should-not-appear")).toBeNull();
  });

  it("should handle reonboarding with accountToReonboard", () => {
    const reonboardAccount = createMockAccount({
      id: "existing-account-id",
      freshAddressPath: "44'/60'/0'/0/0",
    });
    const routeParams = createMockRouteParams({
      isReonboarding: true,
      accountToReonboard: reonboardAccount,
      accountsToAdd: [createMockAccount({ id: "other-account" })],
    });

    expect(() => renderComponent(routeParams)).not.toThrow();
  });

  describe("Error handling", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should display UserRefusedOnDevice error with warning alert", async () => {
      const error = new UserRefusedOnDevice("errors.UserRefusedOnDevice.description");
      BridgeOnboardMock.mockReturnValue(createMockOnboardObservable(error));

      const rendered = renderComponent();

      await waitFor(() => {
        expect(rendered.getByText("errors.UserRefusedOnDevice.title")).toBeTruthy();
      });

      const output = JSON.stringify(rendered.toJSON());
      expect(output).toContain("errors.UserRefusedOnDevice.title");
      expect(output).toContain("errors.UserRefusedOnDevice.description");
    });

    it("should display LockedDeviceError error with error alert", async () => {
      const error = new LockedDeviceError("errors.LockedDeviceError.description");
      BridgeOnboardMock.mockReturnValue(createMockOnboardObservable(error));

      const rendered = renderComponent();

      await waitFor(() => {
        expect(rendered.getByText("errors.LockedDeviceError.title")).toBeTruthy();
      });

      const output = JSON.stringify(rendered.toJSON());
      expect(output).toContain("errors.LockedDeviceError.title");
      expect(output).toContain("errors.LockedDeviceError.description");
    });

    it("should display quota exceeded error (HTTP 429) with learn more link", async () => {
      const error = new LedgerAPI4xx("Canton Network quota exceeded", {
        status: 429,
        url: "https://api.example.com/onboard",
        method: "POST",
      });
      BridgeOnboardMock.mockReturnValue(createMockOnboardObservable(error));

      const rendered = renderComponent();

      await waitFor(() => {
        expect(rendered.getByText("canton.onboard.error429")).toBeTruthy();
      });

      const output = JSON.stringify(rendered.toJSON());
      expect(output).toContain("canton.onboard.error429");
      expect(output).toContain("common.learnMore");
    });

    it("should display generic error for unknown errors", async () => {
      const error = new Error("Something went wrong");
      BridgeOnboardMock.mockReturnValue(createMockOnboardObservable(error));

      const rendered = renderComponent();

      await waitFor(() => {
        expect(rendered.getByText("Something went wrong")).toBeTruthy();
      });

      const output = JSON.stringify(rendered.toJSON());
      expect(output).toContain("Something went wrong");
    });

    it("should provide retry button for all error types", async () => {
      const error = new UserRefusedOnDevice("errors.UserRefusedOnDevice.description");
      BridgeOnboardMock.mockReturnValue(createMockOnboardObservable(error));

      const rendered = renderComponent();

      await waitFor(() => {
        expect(rendered.getByTestId("trans-common.retry")).toBeTruthy();
      });
    });
  });
});
