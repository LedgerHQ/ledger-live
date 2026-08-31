import { act, renderHook } from "@testing-library/react";
import { useNavigate } from "react-router";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useOpenAssetFlow } from "../../../ModularDialog/hooks/useOpenAssetFlow";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockOpenAssetFlow = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("../../../ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(() => ({
    openAssetFlow: mockOpenAssetFlow,
    openAddAccountFlow: jest.fn(),
  })),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);

function render(onTrackEvent = jest.fn()) {
  return renderHook(() => usePayTabDepositOptions(onTrackEvent));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: jest.fn(),
    });
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

  it("opens the asset flow filtered to the stablecoin category for receive", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockOpenAssetFlow).toHaveBeenCalledWith(undefined, undefined, [
      AssetCategory.Stablecoins,
    ]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("skips receive options when opening receive from Pay", () => {
    render();

    expect(mockedUseOpenAssetFlow).toHaveBeenCalledWith(expect.anything(), "Pay", "MODAL_RECEIVE", {
      shouldUseReceiveOptions: false,
    });
  });
});
