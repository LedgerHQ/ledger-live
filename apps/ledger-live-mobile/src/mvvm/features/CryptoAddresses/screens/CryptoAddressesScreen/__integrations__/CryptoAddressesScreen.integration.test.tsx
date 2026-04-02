import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import useCryptoAddressesViewModel from "../useCryptoAddressesViewModel";

jest.mock("../useCryptoAddressesViewModel", () => jest.fn());

jest.mock("~/components/globalSyncRefreshControl", () => {
  const { FlatList } = jest.requireActual("react-native");
  return <T,>(
    _Component: React.ComponentType<T>,
  ): React.ComponentType<T & { testID?: string }> =>
    function SyncListMock(props: T & { testID?: string }) {
      return <FlatList {...props} />;
    };
});

jest.mock("LLM/features/Accounts/components/AccountItem", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ account }: { account: Account }) => <Text>{account.id}</Text>,
  };
});

jest.mock("LLM/features/Accounts/screens/AddAccount", () => {
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ isOpened }: { isOpened: boolean }) =>
      isOpened ? <View testID="add-account-drawer" /> : null,
  };
});


const mockedViewModel = jest.mocked(useCryptoAddressesViewModel);

const mockAccount = { type: "Account", id: "account-1" } as Account;

const baseViewModel: ReturnType<typeof useCryptoAddressesViewModel> = {
  accounts: [],
  hasNoAccount: true,
  isLoading: false,
  error: null,
  onAccountPress: jest.fn(),
  onAddAccountPress: jest.fn(),
  onCloseAddAccount: jest.fn(),
  onNavigateBack: jest.fn(),
  isAddAccountOpen: false,
  title: "Accounts",
  addAccountLabel: "Add account",
  emptyStateLabel: "No accounts yet",
  trackingPage: "CryptoAddresses",
  sourceScreenName: undefined,
};

function renderScreen(vmOverrides: Partial<ReturnType<typeof useCryptoAddressesViewModel>> = {}) {
  mockedViewModel.mockReturnValue({ ...baseViewModel, ...vmOverrides });

  const CryptoAddressesScreen =
    jest.requireActual("../index").default;

  return render(
    <CryptoAddressesScreen
      route={{ params: {}, key: "test", name: "CryptoAddresses" }}
      navigation={{} as never}
    />,
  );
}

describe("CryptoAddressesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navbar", () => {
    it("should render the title in the NavBar", () => {
      renderScreen();
      expect(screen.getByText("Accounts")).toBeVisible();
    });

    it("should call onNavigateBack when back button is pressed", () => {
      const onNavigateBack = jest.fn();
      renderScreen({ onNavigateBack });
      fireEvent.press(screen.getByLabelText("Go back"));
      expect(onNavigateBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("footer", () => {
    it("should render the add account button", () => {
      renderScreen();
      expect(screen.getByTestId("crypto-addresses-add-button")).toBeVisible();
    });

    it("should render the add account label", () => {
      renderScreen();
      expect(screen.getByText("Add account")).toBeVisible();
    });
  });

  describe("accounts list", () => {
    it("should render account items when accounts exist", () => {
      renderScreen({
        accounts: [mockAccount],
        hasNoAccount: false,
      });

      expect(screen.getByText("account-1")).toBeVisible();
    });
  });

  describe("empty state", () => {
    it("should show empty state when no accounts and not loading", () => {
      renderScreen({
        accounts: [],
        hasNoAccount: true,
        isLoading: false,
        error: null,
      });

      expect(screen.getByText("No accounts yet")).toBeVisible();
    });
  });

  describe("loading state", () => {
    it("should show loading skeletons when loading", () => {
      renderScreen({
        accounts: [],
        hasNoAccount: true,
        isLoading: true,
        error: null,
      });

      expect(screen.queryByText("No accounts yet")).toBeNull();
    });
  });

  describe("error state", () => {
    it("should show error message when sync error occurs", () => {
      renderScreen({
        accounts: [],
        hasNoAccount: true,
        isLoading: false,
        error: new Error("sync failed"),
      });

      expect(
        screen.getByText("An error occurred while loading your accounts"),
      ).toBeVisible();
    });
  });

  describe("add account drawer", () => {
    it("should not render drawer when closed", () => {
      renderScreen({ isAddAccountOpen: false });
      expect(screen.queryByTestId("add-account-drawer")).toBeNull();
    });

    it("should render drawer when open", () => {
      renderScreen({ isAddAccountOpen: true });
      expect(screen.getByTestId("add-account-drawer")).toBeVisible();
    });
  });
});
