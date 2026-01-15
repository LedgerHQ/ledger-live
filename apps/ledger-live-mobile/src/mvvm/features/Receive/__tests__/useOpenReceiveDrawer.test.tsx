import { renderHook, act } from "@testing-library/react-native";
import { useOpenReceiveDrawer } from "../index";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";

const mockOpenDrawer = jest.fn();
const mockOpenReceiveOptionsDrawer = jest.fn();
const mockNavigate = jest.fn();
const mockShowNoahMenu = jest.fn(() => false);

jest.mock("../../ModularDrawer", () => ({
  useModularDrawerController: () => ({
    openDrawer: mockOpenDrawer,
  }),
}));

jest.mock("../useReceiveOptionsDrawerController", () => ({
  useReceiveOptionsDrawerController: () => ({
    openDrawer: mockOpenReceiveOptionsDrawer,
  }),
}));

jest.mock("../../Noah/useNoahEntryPoint", () => ({
  useReceiveNoahEntry: () => ({
    showNoahMenu: mockShowNoahMenu(),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const createTestProps = (overrides = {}) => ({
  currency: mockEthCryptoCurrency,
  sourceScreenName: "test_screen",
  ...overrides,
});

const mockAccount: Account = {
  id: "account-123",
  type: "Account",
  seedIdentifier: "seed-123",
  derivationMode: "" as const,
  currency: mockEthCryptoCurrency,
  index: 0,
  freshAddress: "0x123",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  lastSyncDate: new Date(),
  creationDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  used: false,
};

describe("useOpenReceiveDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowNoahMenu.mockReturnValue(false);
  });

  describe("when Noah menu is disabled", () => {
    beforeEach(() => {
      mockShowNoahMenu.mockReturnValue(false);
    });

    it("should open modular drawer with correct parameters", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        currencies: [mockEthCryptoCurrency.id],
        flow: "receive_flow",
        source: "test_screen",
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        onAccountSelected: expect.any(Function),
      });
      expect(mockOpenReceiveOptionsDrawer).not.toHaveBeenCalled();
    });

    it("should handle missing currency by passing empty currencies array", () => {
      const { result } = renderHook(() =>
        useOpenReceiveDrawer(createTestProps({ currency: undefined })),
      );

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        currencies: [],
        flow: "receive_flow",
        source: "test_screen",
        areCurrenciesFiltered: false,
        enableAccountSelection: true,
        onAccountSelected: expect.any(Function),
      });
    });
  });

  describe("when Noah menu is enabled", () => {
    beforeEach(() => {
      mockShowNoahMenu.mockReturnValue(true);
    });

    it("should open receive options drawer instead of modular drawer", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      expect(mockOpenReceiveOptionsDrawer).toHaveBeenCalledWith({
        currency: mockEthCryptoCurrency,
        sourceScreenName: "test_screen",
        fromMenu: undefined,
      });
      expect(mockOpenDrawer).not.toHaveBeenCalled();
    });

    it("should pass fromMenu parameter to receive options drawer", () => {
      const { result } = renderHook(() =>
        useOpenReceiveDrawer(createTestProps({ fromMenu: true })),
      );

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      expect(mockOpenReceiveOptionsDrawer).toHaveBeenCalledWith({
        currency: mockEthCryptoCurrency,
        sourceScreenName: "test_screen",
        fromMenu: true,
      });
    });

    it("should bypass Noah menu when blockNoahMenu parameter is true", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer(true);
      });

      expect(mockOpenDrawer).toHaveBeenCalled();
      expect(mockOpenReceiveOptionsDrawer).not.toHaveBeenCalled();
    });
  });

  describe("onAccountSelected callback", () => {
    it("should navigate to ReceiveConfirmation with correct params", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;

      act(() => {
        onAccountSelected(mockAccount);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          parentId: undefined,
          currency: mockEthCryptoCurrency,
          accountId: mockAccount.id,
          hideBackButton: true,
        },
      });
    });

    it("should handle hideBackButton parameter", () => {
      const { result } = renderHook(() =>
        useOpenReceiveDrawer(createTestProps({ hideBackButton: false })),
      );

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;

      act(() => {
        onAccountSelected(mockAccount);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          parentId: undefined,
          currency: mockEthCryptoCurrency,
          accountId: mockAccount.id,
          hideBackButton: false,
        },
      });
    });

    it("should use navigationOverride when provided", () => {
      const mockNavigationOverride = {
        navigate: jest.fn(),
      } as unknown as RootNavigation;

      const { result } = renderHook(() =>
        useOpenReceiveDrawer(createTestProps({ navigationOverride: mockNavigationOverride })),
      );

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;

      act(() => {
        onAccountSelected(mockAccount);
      });

      expect(mockNavigationOverride.navigate).toHaveBeenCalledWith(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.ReceiveFunds,
        params: {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            parentId: undefined,
            currency: mockEthCryptoCurrency,
            accountId: mockAccount.id,
          },
        },
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle token account with parent account", () => {
      const mockParentAccount: Account = {
        ...mockAccount,
        id: "parent-account-123",
      };

      const mockTokenAccount = {
        type: "TokenAccount" as const,
        id: "token-account-123",
        parentId: "parent-account-123",
        token: mockEthCryptoCurrency,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        creationDate: new Date(),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        starred: false,
        balanceHistoryCache: {
          HOUR: { latestDate: null, balances: [] },
          DAY: { latestDate: null, balances: [] },
          WEEK: { latestDate: null, balances: [] },
        },
        swapHistory: [],
      };

      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;

      act(() => {
        onAccountSelected(mockTokenAccount, mockParentAccount);
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          parentId: mockParentAccount.id,
          currency: mockEthCryptoCurrency,
          accountId: mockTokenAccount.parentId,
          hideBackButton: true,
        },
      });
    });
  });
});
