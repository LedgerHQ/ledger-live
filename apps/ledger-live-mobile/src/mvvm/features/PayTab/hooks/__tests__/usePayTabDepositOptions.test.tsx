import { act, renderHook } from "@tests/test-renderer";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { NavigatorName, ScreenName } from "~/const";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockHandleOpenBuySell = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: jest.fn(() => ({
    handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
  })),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: jest.fn(() => ({ handleOpenSwap: mockHandleOpenSwap })),
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: jest.fn(() => ({ handleOpenBuySell: mockHandleOpenBuySell })),
}));

function render(onTrackEvent = jest.fn()) {
  return renderHook(() => usePayTabDepositOptions(onTrackEvent));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes the deposit page to the feature", () => {
    const { result } = render();

    expect(result.current.depositOptions.page).toBe("Pay");
  });

  it("passes the host tracking callback through", () => {
    const onTrackEvent = jest.fn();
    const { result } = render(onTrackEvent);

    expect(result.current.depositOptions.onTrackEvent).toBe(onTrackEvent);
  });

  it("toggles isOpen via open and onClose", () => {
    const { result } = render();

    expect(result.current.depositOptions.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.depositOptions.isOpen).toBe(true);

    act(() => result.current.depositOptions.onClose());
    expect(result.current.depositOptions.isOpen).toBe(false);
  });

  it("navigates to the Noah fiat provider for bankTransfer", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("bankTransfer"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: { manifestId: "noah", fromMenu: true },
    });
  });

  it("opens the swap flow for swap", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("swap"));

    expect(mockHandleOpenSwap).toHaveBeenCalledTimes(1);
  });

  it("opens the buy flow for buy", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("buy"));

    expect(mockHandleOpenBuySell).toHaveBeenCalledWith("buy");
  });

  it("configures the receive drawer filtered to the stablecoin category", () => {
    render();

    expect(useOpenReceiveDrawer).toHaveBeenCalledWith({
      categories: [AssetCategory.Stablecoins],
      sourceScreenName: "Pay",
      fromMenu: true,
    });
  });

  it("opens the receive drawer filtered to stablecoins for receive", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
