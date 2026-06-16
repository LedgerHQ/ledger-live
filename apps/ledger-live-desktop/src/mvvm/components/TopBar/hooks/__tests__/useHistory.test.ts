import { Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useHistory } from "../useHistory";
import { useNavigate, useLocation } from "react-router";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

const createLocation = (pathname: string, search = "") => ({
  pathname,
  state: null,
  key: "default",
  search,
  hash: "",
});

describe("useHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/history"));
  });

  it("returns handleHistory, historyIcon, hasUnread, and cta", () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.handleHistory).toBeDefined();
    expect(result.current.historyIcon).toBe(Clock);
    expect(result.current.cta).toBeDefined();
  });

  it("navigates to /history and sets tracking source when not already on history page", () => {
    mockUseLocation.mockReturnValueOnce(createLocation("/accounts"));

    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.handleHistory();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/history", { replace: false });
  });

  it("does not navigate when already on unfiltered history page", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.handleHistory();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to unfiltered history when already on filtered history page", () => {
    mockUseLocation.mockReturnValueOnce(
      createLocation("/history", "?accountIds=account-1,account-2"),
    );

    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.handleHistory();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/history", { replace: true });
  });

  describe("hasUnread", () => {
    it("is false when lastSeenOperationDate is null", () => {
      const { result } = renderHook(() => useHistory(), {
        initialState: { history: { lastSeenOperationDate: null } },
      });

      expect(result.current.hasUnread).toBe(false);
    });

    it("is false when there are no accounts", () => {
      const { result } = renderHook(() => useHistory(), {
        initialState: {
          accounts: [],
          history: { lastSeenOperationDate: new Date("2024-01-01").toISOString() },
        },
      });

      expect(result.current.hasUnread).toBe(false);
    });

    it("is true when an account has an operation newer than lastSeenOperationDate", () => {
      const account = genAccount("btc-unread", {
        currency: BTC_ACCOUNT.currency,
        operationsSize: 3,
      });
      // epoch ensures all real operations are newer
      const epoch = new Date(0).toISOString();

      const { result } = renderHook(() => useHistory(), {
        initialState: {
          accounts: [account],
          history: { lastSeenOperationDate: epoch },
        },
      });

      expect(result.current.hasUnread).toBe(true);
    });

    it("is false when lastSeenOperationDate is in the future", () => {
      const account = genAccount("btc-read", { currency: BTC_ACCOUNT.currency, operationsSize: 3 });
      const future = new Date("2099-01-01").toISOString();

      const { result } = renderHook(() => useHistory(), {
        initialState: {
          accounts: [account],
          history: { lastSeenOperationDate: future },
        },
      });

      expect(result.current.hasUnread).toBe(false);
    });
  });

  describe("handleHistory and lastSeenOperationDate", () => {
    it("does not update lastSeenOperationDate when navigating to history", () => {
      mockUseLocation.mockReturnValueOnce(createLocation("/accounts"));

      const { result, store } = renderHook(() => useHistory(), {
        initialState: { history: { lastSeenOperationDate: null } },
      });

      act(() => {
        result.current.handleHistory();
      });

      expect(store.getState().history.lastSeenOperationDate).toBeNull();
    });

    it("does not update lastSeenOperationDate when already on history", () => {
      const original = "2020-01-01T00:00:00.000Z";
      const { result, store } = renderHook(() => useHistory(), {
        initialState: { history: { lastSeenOperationDate: original } },
      });

      act(() => {
        result.current.handleHistory();
      });

      expect(store.getState().history.lastSeenOperationDate).toBe(original);
    });
  });
});
