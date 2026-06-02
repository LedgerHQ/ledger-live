import { renderHook, act } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useNavigateToStakeForAccount } from "../useNavigateToStakeForAccount";

const mockNavigate = jest.fn();
const mockGetCanStakeUsingLedgerLive = jest.fn().mockReturnValue(false);
const mockGetRouteToPlatformApp = jest.fn().mockReturnValue(null);

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeUsingLedgerLive: mockGetCanStakeUsingLedgerLive,
    getRouteToPlatformApp: mockGetRouteToPlatformApp,
  }),
}));

const btc = getCryptoCurrencyById("bitcoin");
const tron = getCryptoCurrencyById("tron");

describe("useNavigateToStakeForAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCanStakeUsingLedgerLive.mockReturnValue(false);
    mockGetRouteToPlatformApp.mockReturnValue(null);
  });

  it("navigates to Earn for partner routes, not /platform", () => {
    const account = genAccount("tron-stake", { currency: tron });
    const platformState = {
      appId: "partner-app",
      customDappUrl: "https://earn.example/?yieldId=tron-native-staking",
      returnTo: "/asset/tron",
    };
    mockGetRouteToPlatformApp.mockReturnValue({
      pathname: "/platform/partner-app",
      state: platformState,
    });

    const { result } = renderHook(() => useNavigateToStakeForAccount());

    let outcome: ReturnType<typeof result.current.navigateToStakeForAccount> | undefined;
    act(() => {
      outcome = result.current.navigateToStakeForAccount(account, undefined, {
        returnTo: "/asset/tron",
      });
    });

    expect(outcome).toEqual({ outcome: "platform_earn", provider: "partner-app" });
    expect(mockNavigate).toHaveBeenCalledWith("/earn", { state: platformState });
    expect(mockNavigate).not.toHaveBeenCalledWith("/platform/partner-app", expect.anything());
  });

  it("opens the native staking modal for Ledger Live staking currencies", () => {
    mockGetCanStakeUsingLedgerLive.mockReturnValue(true);
    const account = genAccount("eth-stake", { currency: getCryptoCurrencyById("ethereum") });
    account.spendableBalance = new BigNumber(1);

    const { result, store } = renderHook(() => useNavigateToStakeForAccount());

    let outcome: ReturnType<typeof result.current.navigateToStakeForAccount> | undefined;
    act(() => {
      outcome = result.current.navigateToStakeForAccount(account, undefined, {
        source: "Asset",
      });
    });

    expect(outcome).toEqual({ outcome: "native_stake" });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().modals.MODAL_START_STAKE?.isOpened).toBe(true);
  });

  it("falls back to earn deposit intent when no partner or native route exists", () => {
    const account = genAccount("btc-stake", { currency: btc });
    account.spendableBalance = new BigNumber(1);

    const { result } = renderHook(() => useNavigateToStakeForAccount());

    act(() => {
      result.current.navigateToStakeForAccount(account, undefined);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/earn", {
      state: { intent: "deposit", cryptoAssetId: "bitcoin" },
    });
  });

  it("opens no-funds when alwaysShowNoFunds is set", () => {
    const account = genAccount("btc-no-funds", { currency: btc });
    account.spendableBalance = new BigNumber(10);

    const { result, store } = renderHook(() => useNavigateToStakeForAccount());

    act(() => {
      result.current.navigateToStakeForAccount(account, undefined, { alwaysShowNoFunds: true });
    });

    expect(mockGetRouteToPlatformApp).not.toHaveBeenCalled();
    expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
  });
});
