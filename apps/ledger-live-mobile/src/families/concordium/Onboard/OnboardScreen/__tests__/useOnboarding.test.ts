import { renderHook, waitFor, act } from "@tests/test-renderer";
import { Subject } from "rxjs";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  CreateStatus,
  getConfirmationCode,
  isSessionExpiredError,
  useOnboarding,
} from "../hooks/useOnboarding";

let onboardSubject: Subject<unknown>;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: () => ({
    onboardAccount: () => onboardSubject.asObservable(),
    pairWalletConnect: jest.fn(),
  }),
}));

const currency = getCryptoCurrencyById("concordium");
const creatableAccount = genAccount("concordium-1", { currency });
const sessionTopic = "ABCD1234longersessiontopic";

describe("getConfirmationCode", () => {
  it("should return first 4 chars uppercased", () => {
    expect(getConfirmationCode("abcd1234")).toBe("ABCD");
  });

  it("should handle already uppercase input", () => {
    expect(getConfirmationCode("WXYZ9999")).toBe("WXYZ");
  });
});

describe("isSessionExpiredError", () => {
  it("should return true for no active session error", () => {
    expect(
      isSessionExpiredError(new Error("No active WalletConnect session for concordium_testnet")),
    ).toBe(true);
  });

  it("should return true for pairing approval expired", () => {
    expect(isSessionExpiredError(new Error("Pairing approval is expired. Please try again."))).toBe(
      true,
    );
  });

  it("should return false for other errors", () => {
    expect(isSessionExpiredError(new Error("network failure"))).toBe(false);
  });

  it("should return false for unrelated expired errors", () => {
    expect(isSessionExpiredError(new Error("certificate expired"))).toBe(false);
  });
});

describe("useOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onboardSubject = new Subject();
  });

  it("should start in PREPARING state with confirmation code", () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    expect(result.current.createStatus).toBe(CreateStatus.PREPARING);
    expect(result.current.confirmationCode).toBe("ABCD");
  });

  it("should transition to SUBMITTING on SIGN status", async () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    act(() => {
      onboardSubject.next({ status: AccountOnboardStatus.SIGN });
    });

    await waitFor(() => {
      expect(result.current.createStatus).toBe(CreateStatus.SUBMITTING);
    });
  });

  it("should transition to SUBMITTING on SUBMIT status", async () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    act(() => {
      onboardSubject.next({ status: AccountOnboardStatus.SUBMIT });
    });

    await waitFor(() => {
      expect(result.current.createStatus).toBe(CreateStatus.SUBMITTING);
    });
  });

  it("should transition to SUCCESS and expose completed account when result arrives", async () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    act(() => {
      onboardSubject.next({ account: creatableAccount });
    });

    await waitFor(() => {
      expect(result.current.createStatus).toBe(CreateStatus.SUCCESS);
      expect(result.current.completedAccount).toBe(creatableAccount);
    });
  });

  it("should call onSessionExpired on expired error", async () => {
    const onSessionExpired = jest.fn();
    renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    act(() => {
      onboardSubject.error(new Error("No active WalletConnect session for concordium_testnet"));
    });

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });
  });

  it("should transition to ERROR on non-expiry error", async () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    act(() => {
      onboardSubject.error(new Error("network failure"));
    });

    await waitFor(() => {
      expect(result.current.createStatus).toBe(CreateStatus.ERROR);
      expect(onSessionExpired).not.toHaveBeenCalled();
    });
  });

  it("should unsubscribe on unmount", () => {
    const onSessionExpired = jest.fn();
    const { unmount } = renderHook(() =>
      useOnboarding(currency, "device-id", creatableAccount, sessionTopic, onSessionExpired),
    );

    expect(onboardSubject.observed).toBe(true);

    act(() => {
      unmount();
    });

    expect(onboardSubject.observed).toBe(false);
  });
});
