import React from "react";
import { render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import useCryptoAddressesViewModel from "../useCryptoAddressesViewModel";
import type { AggregatedAccountEntry } from "@ledgerhq/asset-aggregation/index";

jest.mock("../useCryptoAddressesViewModel", () => jest.fn());

jest.mock("~/components/globalSyncRefreshControl", () => {
  const { FlatList } = jest.requireActual("react-native");
  return <T,>(_Component: React.ComponentType<T>): React.ComponentType<T & { testID?: string }> =>
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
  aggregatedAccountsData: new Map<string, AggregatedAccountEntry>(),
  hasNoAccount: true,
  isLoading: false,
  error: null,
  onAccountPress: jest.fn(),
  onAddAccountPress: jest.fn(),
  onCloseAddAccount: jest.fn(),
  isAddAccountOpen: false,
  addAccountLabel: "Add account",
  emptyStateLabel: "No accounts yet",
  trackingPage: ScreenName.Accounts,
  sourceScreenName: undefined,
  hideAddAccount: false,
};

function renderScreen(vmOverrides: Partial<ReturnType<typeof useCryptoAddressesViewModel>> = {}) {
  mockedViewModel.mockReturnValue({ ...baseViewModel, ...vmOverrides });

  const CryptoAddressesScreen = jest.requireActual("../index").default;

  return render(
    <CryptoAddressesScreen
      route={{ params: {}, key: "test", name: ScreenName.CryptoAddresses }}
      navigation={{} as never}
    />,
  );
}

describe("CryptoAddressesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    it("should hide the add account footer when hideAddAccount is true", () => {
      renderScreen({ hideAddAccount: true });
      expect(screen.queryByTestId("crypto-addresses-add-button")).toBeNull();
      expect(screen.queryByText("Add account")).toBeNull();
    });
  });

  describe("accounts list", () => {
    it("should render account items when accounts exist", () => {
      renderScreen({
        accounts: [mockAccount],
        aggregatedAccountsData: new Map([
          ["account-1", { countervalue: new BigNumber(1000), subAccountsCount: 0 }],
        ]),
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

      expect(screen.getByText("An error occurred while loading your accounts")).toBeVisible();
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
