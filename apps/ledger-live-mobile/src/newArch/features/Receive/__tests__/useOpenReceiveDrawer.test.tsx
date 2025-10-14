import { renderHook, act } from "@testing-library/react-native";
import { useOpenReceiveDrawer } from "../index";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";

const mockOpenDrawer = jest.fn();
const mockNavigate = jest.fn();
const mockOnClick = jest.fn();
const mockIsModularDrawerVisible = jest.fn();

jest.mock("../../ModularDrawer", () => ({
  useModularDrawerController: () => ({
    openDrawer: mockOpenDrawer,
  }),
  useModularDrawerVisibility: () => ({
    isModularDrawerVisible: mockIsModularDrawerVisible,
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
  onClick: mockOnClick,
  ...overrides,
});

const mockReceiveFlowVisibility = (isEnabled: boolean) => {
  mockIsModularDrawerVisible.mockImplementation(({ location }) => {
    return isEnabled
      ? location === ModularDrawerLocation.RECEIVE_FLOW
      : location !== ModularDrawerLocation.RECEIVE_FLOW;
  });
};

describe("useOpenReceiveDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when modular drawer is enabled", () => {
    beforeEach(() => {
      mockReceiveFlowVisibility(true);
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
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("should return isModularDrawerEnabled as true", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      expect(result.current.isModularDrawerEnabled).toBe(true);
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

  describe("when modular drawer is disabled", () => {
    beforeEach(() => {
      mockReceiveFlowVisibility(false);
    });

    it("should call onClick callback instead of opening drawer", () => {
      const { result } = renderHook(() => useOpenReceiveDrawer(createTestProps()));

      act(() => {
        result.current.handleOpenReceiveDrawer();
      });

      expect(mockOnClick).toHaveBeenCalled();
      expect(mockOpenDrawer).not.toHaveBeenCalled();
    });

    it("should not throw error when onClick callback is undefined", () => {
      const { result } = renderHook(() =>
        useOpenReceiveDrawer(createTestProps({ onClick: undefined })),
      );

      expect(() => {
        act(() => {
          result.current.handleOpenReceiveDrawer();
        });
      }).not.toThrow();
    });
  });
});
