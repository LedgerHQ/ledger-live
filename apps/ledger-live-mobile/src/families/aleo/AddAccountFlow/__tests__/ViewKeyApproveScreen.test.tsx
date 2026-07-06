import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { render, screen, fireEvent } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import {
  useAleoViewKeyApproval,
  buildAccountsWithViewKeys,
} from "@ledgerhq/live-common/families/aleo/react";
import ViewKeyApproveScreen from "../ViewKeyApproveScreen";
import { ScreenName } from "~/const";

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

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoViewKeyApproval: jest.fn(),
  buildAccountsWithViewKeys: jest.fn(),
}));

const mockUseAleoViewKeyApproval = jest.mocked(useAleoViewKeyApproval);
const mockBuildAccountsWithViewKeys = jest.mocked(buildAccountsWithViewKeys);

let capturedOnResult: (() => void) | undefined;

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

jest.mock("~/components/Loading", () => ({
  Loading: () => <View testID="loading" />,
}));

jest.mock("~/components/wrappedUi/Button", () => {
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

const ACCOUNT_1 = { id: "account1", freshAddress: "addr1" } as Account;
const ACCOUNT_2 = { id: "account2", freshAddress: "addr2" } as Account;

const mockParentNavigate = jest.fn();
const mockNavigation = {
  navigate: jest.fn(),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return render(
    <ViewKeyApproveScreen
      route={{ ...mockRoute, params: { ...mockRoute.params, ...routeParamOverrides } } as any}
      navigation={mockNavigation as any}
    />,
  );
};

describe("ViewKeyApproveScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnResult = undefined;
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
    it("shows the full-screen loader instead of the account list", () => {
      renderScreen({
        hookState: { sharePending: false, shareProgress: { completed: 2, total: 2 } },
        payload: { account1: "vk1", account2: "vk2" },
      });

      expect(screen.getByTestId("loading")).toBeTruthy();
      expect(screen.queryByTestId("device-animation")).toBeNull();
      expect(screen.queryByTestId("button-AleoAddAccountViewKeyApproveCancelAll")).toBeNull();
    });
  });

  describe("already-imported account filtering", () => {
    afterEach(() => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([]);
    });

    it("shows only accounts whose freshAddress is not already in the wallet", () => {
      const { useSelector } = jest.requireMock("~/context/hooks");
      useSelector.mockReturnValue([{ id: "existing", freshAddress: "addr1" }]);

      renderScreen({
        hookState: { sharePending: true, shareProgress: { completed: 0, total: 1 } },
      });

      expect(screen.getByText("account2")).toBeTruthy();
      expect(screen.queryByText("account1")).toBeNull();
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
        { id: "existing1", freshAddress: "addr1" },
        { id: "existing2", freshAddress: "addr2" },
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
    it("sets abortedRef on cancel so onResult becomes a no-op", () => {
      renderScreen({
        hookState: { sharePending: true, shareProgress: { completed: 0, total: 2 } },
      });
      fireEvent.press(screen.getByTestId("button-AleoAddAccountViewKeyApproveCancelAll"));
      capturedOnResult!();
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
      expect(mockParentNavigate).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("onResult", () => {
    it("does nothing when payload is null", () => {
      renderScreen({ payload: null });
      capturedOnResult!();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockParentNavigate).not.toHaveBeenCalled();
    });

    it("navigates to AleoNoAccountsAdded when buildAccountsWithViewKeys returns empty", () => {
      mockBuildAccountsWithViewKeys.mockReturnValue([]);
      renderScreen({ payload: {} });
      capturedOnResult!();
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        ScreenName.AleoNoAccountsAdded,
        mockRoute.params,
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("dispatches addAccountsAction and navigates to AddAccountsSuccess", () => {
      mockBuildAccountsWithViewKeys.mockReturnValue([ACCOUNT_1]);
      renderScreen({ payload: { account1: "vk1" } });
      capturedOnResult!();
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
