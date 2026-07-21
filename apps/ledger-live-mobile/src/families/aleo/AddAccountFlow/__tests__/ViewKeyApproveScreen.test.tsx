import React from "react";
import { View, Text, TouchableOpacity, Pressable, BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { render, screen } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import {
  useAleoViewKeyApproval,
  buildAccountsWithViewKeys,
} from "@ledgerhq/live-common/families/aleo/react";
import ViewKeyApproveScreen from "../ViewKeyApproveScreen";
import { ScreenName } from "~/const";
import { aleoCurrency, aleoTestnetCurrency } from "../../__mocks__/currency.mock";

type MockViewKeyApprovalReturn = {
  hookState: {
    sharePending: boolean;
    shareProgress: { completed: number; total: number };
  };
  payload: Record<string, string | null> | null;
  request: Record<string, unknown>;
  confirmedAccountIds: Set<string>;
  rejectedAccountIds: Set<string>;
};

const defaultReturn: MockViewKeyApprovalReturn = {
  hookState: { sharePending: false, shareProgress: { completed: 0, total: 2 } },
  payload: null,
  request: {},
  confirmedAccountIds: new Set(),
  rejectedAccountIds: new Set(),
};

let mockViewKeyApprovalReturn: MockViewKeyApprovalReturn = { ...defaultReturn };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => callback(), [callback]);
  }),
}));

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoViewKeyApproval: jest.fn(),
  buildAccountsWithViewKeys: jest.fn(),
}));

const mockUseNavigation = jest.mocked(useNavigation);
const mockUseRoute = jest.mocked(useRoute);
const mockUseAleoViewKeyApproval = jest.mocked(useAleoViewKeyApproval);
const mockBuildAccountsWithViewKeys = jest.mocked(buildAccountsWithViewKeys);

let capturedOnResult: (() => void) | undefined;
let capturedOnClose: (() => void) | undefined;
let capturedOnModalHide: (() => void) | undefined;

jest.mock("~/components/ConfirmationModal", () => {
  return function MockConfirmationModal({
    isOpened,
    onClose,
    onConfirm,
    onModalHide,
  }: {
    isOpened: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    onModalHide?: () => void;
  }) {
    capturedOnClose = onClose;
    capturedOnModalHide = onModalHide;
    if (!isOpened) return null;
    return <Pressable testID="enabled-confirmation-modal-confirm-button" onPress={onConfirm} />;
  };
});

jest.mock("~/components/DeviceAction", () => ({
  DeviceActionDefaultRendering: jest.fn(({ onResult }: { onResult: () => void }) => {
    capturedOnResult = onResult;
    return <View testID="device-action-rendering" />;
  }),
}));

jest.mock("~/components/Animation", () => {
  return () => <View testID="device-animation" />;
});

jest.mock("~/helpers/getDeviceAnimation", () => ({
  getDeviceAnimation: jest.fn(() => null),
  getDeviceAnimationStyles: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    Spinner: () => <View testID="icon-spinner" />,
    Banner: ({ description }: { description: React.ReactNode }) => (
      <View testID="banner">{description}</View>
    ),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => ({
  Check: () => <View testID="icon-check" />,
  Close: () => <View testID="icon-close" />,
  Refresh: () => <View testID="icon-refresh" />,
}));

jest.mock("~/components/wrappedUi/Button", () => {
  return ({
    children,
    onPress,
    event,
    disabled,
  }: {
    children: React.ReactNode;
    onPress: () => void;
    event: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity testID={`button-${event}`} onPress={onPress} disabled={disabled}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

const mockDispatch = jest.fn();

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(() => []),
  useDispatch: jest.fn(() => mockDispatch),
}));

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useAccountName: jest.fn((account: Account) => account.id),
}));

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(() => ({ type: "ADD_ACCOUNTS" })),
}));

const ACCOUNT_1 = {
  id: "account1",
  freshAddress: "addr1",
  currency: aleoCurrency,
} as unknown as Account;

const ACCOUNT_2 = {
  id: "account2",
  freshAddress: "addr2",
  currency: aleoCurrency,
} as unknown as Account;

const ACCOUNT_TESTNET_1 = {
  id: "accountTestnet1",
  freshAddress: ACCOUNT_1.freshAddress,
  currency: aleoTestnetCurrency,
} as unknown as Account;

const mockParentNavigate = jest.fn();
const mockNavigation = {
  replace: jest.fn(),
  getParent: jest.fn(() => ({ navigate: mockParentNavigate })),
};

const mockRoute = {
  params: {
    currency: { type: "CryptoCurrency" as const, id: "aleo" },
    device: { modelId: "stax", deviceId: "test-device-id" },
    accountsToAdd: [ACCOUNT_1, ACCOUNT_2],
    context: undefined,
    onCloseNavigation: undefined as (() => void) | undefined,
  },
  name: ScreenName.AleoViewKeyApprove,
  key: "test-key",
};

const renderScreen = (
  viewKeyOverrides: Partial<MockViewKeyApprovalReturn> = {},
  routeParamOverrides: Partial<typeof mockRoute.params> = {},
) => {
  mockViewKeyApprovalReturn = { ...defaultReturn, ...viewKeyOverrides };
  mockUseAleoViewKeyApproval.mockReturnValue(mockViewKeyApprovalReturn as never);
  mockUseNavigation.mockReturnValue(mockNavigation as never);
  mockUseRoute.mockReturnValue({
    ...mockRoute,
    params: { ...mockRoute.params, ...routeParamOverrides },
  } as never);

  return render(<ViewKeyApproveScreen />);
};

describe("ViewKeyApproveScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnResult = undefined;
    capturedOnClose = undefined;
    capturedOnModalHide = undefined;
    mockBuildAccountsWithViewKeys.mockReturnValue([]);
    mockViewKeyApprovalReturn = { ...defaultReturn };
  });

  describe("when sharePending is false", () => {
    it("renders DeviceActionDefaultRendering without the overlay", () => {
      renderScreen();
      expect(screen.getByTestId("device-action-rendering")).toBeTruthy();
      expect(screen.queryByTestId("device-animation")).toBeNull();
    });
  });

  describe("when sharePending is true", () => {
    it("shows device animation, account names, and cancel button", () => {
      renderScreen({
        hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } },
      });
      expect(screen.getByTestId("device-animation")).toBeTruthy();
      expect(screen.getByText("account1")).toBeTruthy();
      expect(screen.getByText("account2")).toBeTruthy();
      expect(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll")).toBeTruthy();
    });

    describe("account status icons", () => {
      it("shows checkmark for confirmed account and spinner for current account", () => {
        renderScreen({
          hookState: { sharePending: true, shareProgress: { completed: 1, total: 2 } },
          confirmedAccountIds: new Set(["account1"]),
        });
        expect(screen.getByTestId("icon-check")).toBeTruthy();
        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
      });

      it("shows X icon for rejected account", () => {
        renderScreen({
          hookState: { sharePending: true, shareProgress: { completed: 1, total: 2 } },
          rejectedAccountIds: new Set(["account1"]),
        });
        expect(screen.getByTestId("icon-close")).toBeTruthy();
        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
      });

      it("shows refresh icon for accounts not yet processed", () => {
        renderScreen({
          hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } },
        });
        expect(screen.getByTestId("icon-spinner")).toBeTruthy();
        expect(screen.getByTestId("icon-refresh")).toBeTruthy();
      });
    });
  });

  describe("when confirmation is complete (payload is set)", () => {
    it("keeps the account list visible and shows a disabled redirecting button instead of cancel", async () => {
      const { user } = renderScreen({
        hookState: { sharePending: false, shareProgress: { completed: 2, total: 2 } },
        payload: { account1: "vk1", account2: "vk2" },
      });

      expect(screen.getByTestId("device-animation")).toBeTruthy();
      expect(screen.getByText("account1")).toBeTruthy();
      const cancelButton = screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll");
      expect(cancelButton).toBeTruthy();
      expect(screen.getByText("Redirecting...")).toBeTruthy();
      expect(screen.queryByText("Cancel all")).toBeNull();

      // Disabled: pressing it must not open the quit confirmation modal.
      await user.press(cancelButton);
      expect(screen.queryByTestId("enabled-confirmation-modal-confirm-button")).toBeNull();
    });
  });

  describe("already-imported account filtering", () => {
    afterEach(() => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([]);
    });

    it("shows only accounts whose freshAddress is not already in the wallet", () => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([
        { id: "existing", freshAddress: "addr1", currency: aleoCurrency },
      ]);

      renderScreen({
        hookState: { sharePending: true, shareProgress: { completed: 0, total: 1 } },
      });

      expect(screen.getByText("account2")).toBeTruthy();
      expect(screen.queryByText("account1")).toBeNull();
    });

    it("does not filter out a testnet account sharing the same freshAddress as an existing mainnet account", () => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([
        { id: "existing", freshAddress: "addr1", currency: aleoCurrency },
      ]);

      renderScreen(
        { hookState: { sharePending: true, shareProgress: { completed: 0, total: 1 } } },
        {
          accountsToAdd: [ACCOUNT_TESTNET_1],
          currency: { type: "CryptoCurrency" as const, id: aleoTestnetCurrency.id },
        },
      );

      expect(screen.getByText("accountTestnet1")).toBeTruthy();
    });
  });

  describe("no accounts remaining after filtering", () => {
    afterEach(() => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([]);
    });

    it("does not start the device action and closes the flow", () => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([
        { id: "existing1", freshAddress: "addr1", currency: aleoCurrency },
        { id: "existing2", freshAddress: "addr2", currency: aleoCurrency },
      ]);
      const mockOnClose = jest.fn();

      renderScreen({}, { onCloseNavigation: mockOnClose });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockUseAleoViewKeyApproval).toHaveBeenCalledWith(
        expect.objectContaining({ device: null, selectedAccounts: [] }),
      );
    });
  });

  describe("cancel button", () => {
    it("opens a confirmation modal instead of aborting immediately", async () => {
      mockBuildAccountsWithViewKeys.mockReturnValue([ACCOUNT_1]);
      const { user } = renderScreen({
        hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } },
        payload: { account1: "vk1" },
      });
      await user.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));

      expect(screen.getByTestId("enabled-confirmation-modal-confirm-button")).toBeTruthy();
      // Not yet aborted: onResult still proceeds normally.
      capturedOnResult?.();
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("sets abortedRef and calls onCloseNavigation once quit is confirmed", async () => {
      const mockOnCloseNavigation = jest.fn();
      const { user } = renderScreen(
        { hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } } },
        { onCloseNavigation: mockOnCloseNavigation },
      );

      await user.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));
      await user.press(screen.getByTestId("enabled-confirmation-modal-confirm-button"));
      capturedOnModalHide?.();

      capturedOnResult?.();
      expect(mockNavigation.replace).not.toHaveBeenCalled();
      expect(mockParentNavigate).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
    });

    it("still calls onCloseNavigation when the drawer re-invokes onClose before onModalHide", async () => {
      // The drawer fires onClose (sync) before onModalHide (animated); order matters here.
      const mockOnCloseNavigation = jest.fn();
      const { user } = renderScreen(
        { hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } } },
        { onCloseNavigation: mockOnCloseNavigation },
      );

      await user.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));
      await user.press(screen.getByTestId("enabled-confirmation-modal-confirm-button"));
      capturedOnClose?.();
      capturedOnModalHide?.();

      expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
    });

    it("does not call onCloseNavigation when the confirmation modal is dismissed without confirming", async () => {
      const mockOnCloseNavigation = jest.fn();
      mockBuildAccountsWithViewKeys.mockReturnValue([ACCOUNT_1]);
      const { user } = renderScreen(
        {
          hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } },
          payload: { account1: "vk1" },
        },
        { onCloseNavigation: mockOnCloseNavigation },
      );

      await user.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));
      capturedOnClose?.();
      capturedOnModalHide?.();

      expect(mockOnCloseNavigation).not.toHaveBeenCalled();
      // Not aborted: onResult still proceeds normally.
      capturedOnResult?.();
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe("hardware back button (Android)", () => {
    let mockSubscriptionRemove: jest.Mock;

    beforeEach(() => {
      mockSubscriptionRemove = jest.fn();
      jest
        .spyOn(BackHandler, "addEventListener")
        .mockReturnValue({ remove: mockSubscriptionRemove });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("registers a handler that prevents default back navigation", () => {
      renderScreen();
      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function),
      );
      const [[, handler]] = (BackHandler.addEventListener as jest.Mock).mock.calls;
      expect(handler()).toBe(true);
    });

    it("removes the handler when the screen unmounts", () => {
      const { unmount } = renderScreen();
      unmount();
      expect(mockSubscriptionRemove).toHaveBeenCalled();
    });
  });

  describe("onResult", () => {
    it("does nothing when payload is null", () => {
      renderScreen({ payload: null });
      capturedOnResult?.();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockParentNavigate).not.toHaveBeenCalled();
    });

    it("navigates to AleoNoAccountsAdded when buildAccountsWithViewKeys returns empty", () => {
      mockBuildAccountsWithViewKeys.mockReturnValue([]);
      renderScreen({ payload: {} });
      capturedOnResult?.();
      const { accountsToAdd: _accountsToAdd, ...expectedParams } = mockRoute.params;
      expect(mockNavigation.replace).toHaveBeenCalledTimes(1);
      expect(mockNavigation.replace).toHaveBeenCalledWith(
        ScreenName.AleoNoAccountsAdded,
        expectedParams,
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("dispatches addAccountsAction and navigates to AddAccountsSuccess", () => {
      mockBuildAccountsWithViewKeys.mockReturnValue([ACCOUNT_1]);
      renderScreen({ payload: { account1: "vk1" } });
      capturedOnResult?.();
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith({ type: "ADD_ACCOUNTS" });
      expect(mockParentNavigate).toHaveBeenCalledTimes(1);
      expect(mockParentNavigate).toHaveBeenCalledWith(
        ScreenName.AddAccountsSuccess,
        expect.objectContaining({
          currency: expect.anything(),
          accountsToAdd: [ACCOUNT_1],
        }),
      );
    });
  });
});
