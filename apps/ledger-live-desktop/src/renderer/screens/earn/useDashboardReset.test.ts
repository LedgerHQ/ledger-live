import { renderHook, act } from "tests/testSetup";
import { useLocation, useNavigate } from "react-router";
import { EARN_GO_TO_DASHBOARD_EVENT } from "./constants";
import { useDashboardReset } from "./useDashboardReset";

const DASHBOARD_URL = "https://earn.example/en/dashboard?theme=dark";
const DEPOSIT_URL = "https://earn.example/en/deposit?cryptoAssetId=eth";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedUseLocation = jest.mocked(useLocation);

const mockLocationState = (state: unknown) => {
  mockedUseLocation.mockReturnValue({
    pathname: "/earn",
    search: "",
    hash: "",
    state,
    key: "test",
  });
};

const dispatchReset = () =>
  act(() => {
    window.dispatchEvent(new CustomEvent(EARN_GO_TO_DASHBOARD_EVENT));
  });

describe("useDashboardReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockLocationState(null);
  });

  it("bumps the remount key when the live app is inside an intent flow", () => {
    const { result } = renderHook(() => useDashboardReset());
    const initialKey = result.current.resetKey;

    act(() => result.current.onWebviewStateChange({ url: DEPOSIT_URL } as never));
    dispatchReset();

    expect(result.current.resetKey).not.toBe(initialKey);
  });

  it("skips the remount when the live app already sits on its dashboard", () => {
    const { result } = renderHook(() => useDashboardReset());
    const initialKey = result.current.resetKey;

    act(() => result.current.onWebviewStateChange({ url: DASHBOARD_URL } as never));
    dispatchReset();

    expect(result.current.resetKey).toBe(initialKey);
  });

  it("bumps the remount key while the webview URL is still unknown", () => {
    const { result } = renderHook(() => useDashboardReset());
    const initialKey = result.current.resetKey;

    dispatchReset();

    expect(result.current.resetKey).not.toBe(initialKey);
  });

  it("clears a deeplink route state even when no reload is needed", () => {
    mockLocationState({ intent: "deposit", cryptoAssetId: "bitcoin" });
    const { result } = renderHook(() => useDashboardReset());

    act(() => result.current.onWebviewStateChange({ url: DASHBOARD_URL } as never));
    dispatchReset();

    expect(mockNavigate).toHaveBeenCalledWith("/earn", { replace: true, state: null });
    expect(result.current.resetKey).toBe(0);
  });

  it("does not touch the history when there is no route state to clear", () => {
    const { result } = renderHook(() => useDashboardReset());

    act(() => result.current.onWebviewStateChange({ url: DEPOSIT_URL } as never));
    dispatchReset();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("bumps a different key on every reset", () => {
    const { result } = renderHook(() => useDashboardReset());
    const keys = new Set([result.current.resetKey]);

    dispatchReset();
    keys.add(result.current.resetKey);

    dispatchReset();
    keys.add(result.current.resetKey);

    expect(keys.size).toBe(3);
  });

  it("stops listening once unmounted", () => {
    mockLocationState({ intent: "deposit" });
    const { unmount } = renderHook(() => useDashboardReset());

    unmount();
    dispatchReset();

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
