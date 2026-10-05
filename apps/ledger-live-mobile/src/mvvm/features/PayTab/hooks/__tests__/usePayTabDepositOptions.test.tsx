import { act, renderHook } from "@tests/test-renderer";
import { useOpenBuySell } from "LLM/features/Buy";
import { NavigatorName, ScreenName } from "~/const";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockOnCryptoAddress = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockHandleOpenBuySell = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: jest.fn(() => ({ handleOpenSwap: mockHandleOpenSwap })),
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: jest.fn(() => ({ handleOpenBuySell: mockHandleOpenBuySell })),
}));

function render() {
  return renderHook(() => usePayTabDepositOptions(mockOnCryptoAddress));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes the deposit page to the feature", () => {
    const { result } = render();

    expect(result.current.depositOptions.page).toBe("Pay");
  });

  it("toggles isOpen via open and onClose", () => {
    const { result } = render();

    expect(result.current.depositOptions.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.depositOptions.isOpen).toBe(true);

    act(() => result.current.depositOptions.onClose());
    expect(result.current.depositOptions.isOpen).toBe(false);
  });

  it("should open the cash-to-stable intro for bankTransfer without navigating", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("bankTransfer"));

    expect(result.current.bankTransferIntro.isOpen).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to Noah signup when the intro creates an account", () => {
    const { result } = render();

    act(() => result.current.bankTransferIntro.onBankTransfer("createAccount"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: { manifestId: "noah", fromMenu: true, noahAuth: "createAccount" },
    });
  });

  it("should navigate to Noah sign-in when the intro logs in", () => {
    const { result } = render();

    act(() => result.current.bankTransferIntro.onBankTransfer("logIn"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: { manifestId: "noah", fromMenu: true, noahAuth: "logIn" },
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

  it("returns to the Pay tab when the buy flow is closed", () => {
    render();

    expect(useOpenBuySell).toHaveBeenCalledWith({
      sourceScreenName: "Pay",
      returnToPreviousScreenOnClose: true,
    });
  });

  it("opens the request flow for the crypto address option", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockOnCryptoAddress).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
