import { act, renderHook } from "tests/testSetup";
import { useNavigate } from "react-router";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockOnCryptoAddress = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function render() {
  return renderHook(() => usePayTabDepositOptions(mockOnCryptoAddress));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
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

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/bank",
      search: "?noahAuth=createAccount",
    });
  });

  it("should navigate to Noah sign-in when the intro logs in", () => {
    const { result } = render();

    act(() => result.current.bankTransferIntro.onBankTransfer("logIn"));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/bank",
      search: "?noahAuth=logIn",
    });
  });

  it("navigates to the swap tab for swap", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("swap"));

    expect(mockNavigate).toHaveBeenCalledWith("/swap");
  });

  it("navigates to the buy live app for buy", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("buy"));

    expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
      state: { mode: "buy", returnTo: "/paytab" },
    });
  });

  it("opens the request flow for the crypto address option", () => {
    const { result, store } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockOnCryptoAddress).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().modals.MODAL_RECEIVE?.isOpened).toBeFalsy();
  });
});
