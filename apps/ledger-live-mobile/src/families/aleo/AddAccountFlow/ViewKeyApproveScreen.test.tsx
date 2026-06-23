import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import type { Account } from "@ledgerhq/types-live";
import ViewKeyApproveScreen from "./ViewKeyApproveScreen";
import { NavigatorName, ScreenName } from "~/const";

// --- module mocks ---

type MockHookState = {
  result: Record<string, string | null> | null;
  sharePending: boolean;
  error: Error | null;
  shareProgress: {
    completed: number;
    total: number;
    viewKeys: Record<string, string | null>;
  };
};

let mockHookState: MockHookState;

jest.mock("@ledgerhq/live-common/families/aleo/hw/getViewKey/index", () => ({
  createAction: jest.fn(() => ({
    useHook: jest.fn(() => mockHookState),
    mapResult: jest.fn((s: MockHookState) => s.result),
  })),
  getViewKeyExec: jest.fn(),
}));

let capturedOnResult: (() => void) | undefined;

jest.mock("~/components/DeviceAction", () => ({
  DeviceActionDefaultRendering: jest.fn(({ onResult }: { onResult: () => void }) => {
    capturedOnResult = onResult;
    return <View testID="device-action-rendering" />;
  }),
}));

jest.mock("@ledgerhq/live-common/families/aleo/utils", () => ({
  patchAccountWithViewKey: jest.fn((account: Account) => account),
}));

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(() => ({ type: "ADD_ACCOUNTS" })),
}));

jest.mock("~/components/Animation", () => {
  const { View: V } = require("react-native");
  return () => <V testID="device-animation" />;
});

jest.mock("~/helpers/getDeviceAnimation", () => ({
  getDeviceAnimation: jest.fn(() => null),
  getDeviceAnimationStyles: jest.fn(() => ({})),
}));

jest.mock("~/reducers/accounts", () => ({
  accountsSelector: jest.fn(() => []),
}));

jest.mock("~/reducers/wallet", () => ({
  useAccountName: jest.fn((account: Account) => account.id),
}));

const mockDispatch = jest.fn();

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(() => []),
  useDispatch: jest.fn(() => mockDispatch),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(() => null),
}));

jest.mock("@ledgerhq/live-common/hw/connectApp", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("styled-components/native", () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: { main: "#ffffff" },
      opacityDefault: { c05: "rgba(0,0,0,0.05)" },
      neutral: { c80: "#555", c100: "#000", c60: "#999" },
    },
    theme: "light",
  })),
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@ledgerhq/native-ui", () => {
  const { View: V } = require("react-native");
  const AlertMock = Object.assign(
    ({ children }: { children: React.ReactNode }) => <V testID="alert">{children}</V>,
    { BodyText: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  );
  return {
    __esModule: true,
    Alert: AlertMock,
    Icons: {
      Check: () => <V testID="icon-check" />,
      Close: () => <V testID="icon-close" />,
      Refresh: () => <V testID="icon-refresh" />,
    },
    InfiniteLoader: () => <V testID="icon-spinner" />,
  };
});

jest.mock("~/components/LText", () => {
  const { Text } = require("react-native");
  return ({
    children,
    color: _color,
    semiBold: _semiBold,
    ...props
  }: {
    children: React.ReactNode;
    color?: string;
    semiBold?: boolean;
    [key: string]: unknown;
  }) => <Text {...props}>{children}</Text>;
});

jest.mock("~/components/wrappedUi/Button", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({
    children,
    onPress,
    event,
  }: {
    children: React.ReactNode;
    onPress: () => void;
    event: string;
  }) => (
    <TouchableOpacity testID={`button-${event}`} onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

// --- fixtures ---

const ACCOUNT_1 = { id: "account1", freshAddress: "addr1" } as Account;
const ACCOUNT_2 = { id: "account2", freshAddress: "addr2" } as Account;

const mockGoBack = jest.fn();
const mockParentNavigate = jest.fn();
const mockParent = { navigate: mockParentNavigate, goBack: mockGoBack };

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  getParent: jest.fn(() => mockParent),
};

const mockRoute = {
  params: {
    currency: { type: "CryptoCurrency" as const, id: "aleo" },
    device: { modelId: "stax", deviceId: "test-device-id" },
    accountsToAdd: [ACCOUNT_1, ACCOUNT_2],
    context: undefined,
    onCloseNavigation: undefined,
  },
  name: ScreenName.AleoViewKeyApprove,
  key: "test-key",
};

const buildHookState = (overrides: Partial<MockHookState> = {}): MockHookState => ({
  result: null,
  error: null,
  sharePending: false,
  shareProgress: { completed: 0, total: 2, viewKeys: {} },
  ...overrides,
});

const renderScreen = (hookOverrides: Partial<MockHookState> = {}) => {
  mockHookState = buildHookState(hookOverrides);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return render(
    <ViewKeyApproveScreen route={mockRoute as any} navigation={mockNavigation as any} />,
  );
};

// --- tests ---

describe("ViewKeyApproveScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnResult = undefined;
  });

  describe("when sharePending is false", () => {
    it("renders DeviceActionDefaultRendering without the overlay", () => {
      renderScreen({ sharePending: false });

      expect(screen.getByTestId("device-action-rendering")).toBeTruthy();
      expect(screen.queryByTestId("device-animation")).toBeNull();
    });
  });

  describe("when sharePending is true", () => {
    it("shows device animation, account names, and cancel button", () => {
      renderScreen({ sharePending: true });

      expect(screen.getByTestId("device-animation")).toBeTruthy();
      expect(screen.getByText("account1")).toBeTruthy();
      expect(screen.getByText("account2")).toBeTruthy();
      expect(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll")).toBeTruthy();
    });

    describe("account status icons", () => {
      it("shows checkmark for confirmed account and spinner for current account", () => {
        // account1 (index 0): confirmed, account2 (index 1): current (index === completed)
        renderScreen({
          sharePending: true,
          shareProgress: { completed: 1, total: 2, viewKeys: { account1: "vk1" } },
        });

        expect(screen.getByTestId("icon-check")).toBeTruthy();
        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
      });

      it("shows X icon for rejected account", () => {
        // account1 rejected, account2 current
        renderScreen({
          sharePending: true,
          shareProgress: { completed: 1, total: 2, viewKeys: { account1: null } },
        });

        expect(screen.getByTestId("icon-close")).toBeTruthy();
        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
      });

      it("shows refresh icon for accounts not yet processed", () => {
        // account1 (index 0): current (spinner), account2 (index 1): not started (refresh)
        renderScreen({
          sharePending: true,
          shareProgress: { completed: 0, total: 2, viewKeys: {} },
        });

        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
        expect(screen.getByTestId("icon-refresh")).toBeTruthy();
      });
    });
  });

  describe("cancel button", () => {
    it("calls navigation.getParent().goBack()", () => {
      renderScreen({ sharePending: true });

      fireEvent.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("onResult", () => {
    it("navigates to AleoViewKeyRejected when all view keys are explicitly rejected on device", () => {
      renderScreen({
        result: { account1: null, account2: null },
        shareProgress: { completed: 2, total: 2, viewKeys: { account1: null, account2: null } },
      });

      expect(capturedOnResult).toBeDefined();
      capturedOnResult!();

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.AleoViewKeyRejected, mockRoute.params);
      expect(mockGoBack).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("calls goBack when result is empty but not all accounts were explicitly rejected", () => {
      renderScreen({
        result: null,
        shareProgress: { completed: 0, total: 2, viewKeys: {} },
      });

      expect(capturedOnResult).toBeDefined();
      capturedOnResult!();

      expect(mockGoBack).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("patches accounts, dispatches addAccountsAction and navigates to AddAccountsSuccess", () => {
      const { patchAccountWithViewKey } = jest.requireMock(
        "@ledgerhq/live-common/families/aleo/utils",
      );

      renderScreen({ result: { account1: "vk1" } });

      expect(capturedOnResult).toBeDefined();
      capturedOnResult!();

      expect(patchAccountWithViewKey).toHaveBeenCalledWith(ACCOUNT_1, "vk1");
      expect(patchAccountWithViewKey).not.toHaveBeenCalledWith(ACCOUNT_2, expect.anything());
      expect(mockDispatch).toHaveBeenCalledWith({ type: "ADD_ACCOUNTS" });
      expect(mockParentNavigate).toHaveBeenCalledWith(
        NavigatorName.AddAccounts,
        expect.objectContaining({ screen: ScreenName.AddAccountsSuccess }),
      );
    });

    it("does nothing after cancel (abortedRef prevents navigation)", () => {
      renderScreen({ result: null, sharePending: true });

      fireEvent.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));
      expect(mockGoBack).toHaveBeenCalledTimes(1);

      capturedOnResult!();

      expect(mockGoBack).toHaveBeenCalledTimes(1); // not called a second time by onResult
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockParentNavigate).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
