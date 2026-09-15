import { act, renderHook } from "tests/testSetup";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useOpenAssetAndAccount } from "../../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockOpenAssetAndAccount = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("../../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedUseOpenAssetAndAccount = jest.mocked(useOpenAssetAndAccount);

function render(onTrackEvent = jest.fn()) {
  return renderHook(() => usePayTabDepositOptions(onTrackEvent));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedUseOpenAssetAndAccount.mockReturnValue({
      openAssetAndAccount: mockOpenAssetAndAccount,
      openAssetAndAccountPromise: jest.fn(),
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

  it("opens the asset and account flow filtered to the stablecoin category for receive, letting the user pick an existing account or add a new one", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [AssetCategory.Stablecoins],
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the receive modal for the account picked (existing or newly added) once the flow succeeds", () => {
    const { result, store } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    const { onSuccess } = mockOpenAssetAndAccount.mock.calls[0][0];
    const account = { id: "account-1" } as unknown as AccountLike;
    const parentAccount = { id: "parent-1" } as unknown as Account;

    act(() => onSuccess(account, parentAccount));

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: {
        account,
        parentAccount,
        shouldUseReceiveOptions: false,
      },
    });
  });
});
