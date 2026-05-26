import { renderHook, act } from "@tests/test-renderer";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useReceiveOptionsDrawerController } from "../../useReceiveOptionsDrawerController";
import useReceiveFundsOptionsViewModel from "../useReceiveFundsOptionsViewModel";

const mockNavigate = jest.fn();
const mockCloseDrawer = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const receiveCurrencyIds = ["ethereum/erc20/usd__coin", "polygon/erc20/usd_coin"];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useWalletFeaturesConfig: () => ({ isEnabled: true }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(() => ({
    handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
  })),
}));

jest.mock("../../useReceiveOptionsDrawerController", () => ({
  useReceiveOptionsDrawerController: jest.fn(() => ({
    currency: mockEthCryptoCurrency,
    currencyIds: receiveCurrencyIds,
    sourceScreenName: "Asset Detail",
    fromMenu: true,
    isOpen: true,
    closeDrawer: mockCloseDrawer,
  })),
}));

const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);
const mockUseReceiveOptionsDrawerController = jest.mocked(useReceiveOptionsDrawerController);

describe("useReceiveFundsOptionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should keep asset-scoped currency ids when opening crypto address receive", () => {
    const { result } = renderHook(() => useReceiveFundsOptionsViewModel());

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      currency: mockEthCryptoCurrency,
      currencyIds: receiveCurrencyIds,
      sourceScreenName: "Asset Detail",
      fromMenu: true,
    });

    act(() => result.current.handleGoToCrypto());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "crypto",
      page: "Asset Detail",
    });
    expect(mockCloseDrawer).toHaveBeenCalledTimes(1);
    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledWith(true);
  });

  it("should omit currency when the options drawer state has no crypto currency", () => {
    mockUseReceiveOptionsDrawerController.mockReturnValue({
      currency: undefined,
      currencyIds: receiveCurrencyIds,
      sourceScreenName: "Portfolio",
      fromMenu: true,
      isOpen: true,
      closeDrawer: mockCloseDrawer,
      openDrawer: jest.fn(),
    });

    renderHook(() => useReceiveFundsOptionsViewModel());

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      currency: undefined,
      currencyIds: receiveCurrencyIds,
      sourceScreenName: "Portfolio",
      fromMenu: true,
    });
  });
});
