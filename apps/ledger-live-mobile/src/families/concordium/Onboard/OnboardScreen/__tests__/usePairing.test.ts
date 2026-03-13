import { renderHook, waitFor, act } from "@tests/test-renderer";
import { Subject } from "rxjs";
import { ConcordiumPairingStatus } from "@ledgerhq/coin-concordium/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { PairStatus, usePairing } from "../hooks/usePairing";

let pairingSubject: Subject<unknown>;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: () => ({
    pairWalletConnect: () => pairingSubject.asObservable(),
  }),
}));

const currency = getCryptoCurrencyById("concordium");

describe("usePairing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pairingSubject = new Subject();
  });

  it("should start in CONNECTING state", () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing(currency, onPaired));

    expect(result.current.pairStatus).toBe(PairStatus.CONNECTING);
    expect(result.current.walletConnectUri).toBeNull();
  });

  it("should transition to QR_READY when PREPARE event with URI arrives", async () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing(currency, onPaired));

    act(() => {
      pairingSubject.next({
        status: ConcordiumPairingStatus.PREPARE,
        walletConnectUri: "concordiumidapp://test-uri",
      });
    });

    await waitFor(() => {
      expect(result.current.pairStatus).toBe(PairStatus.QR_READY);
      expect(result.current.walletConnectUri).toBe("concordiumidapp://test-uri");
    });
  });

  it("should transition to SUCCESS and call onPaired when SUCCESS event arrives", async () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing(currency, onPaired));

    act(() => {
      pairingSubject.next({
        status: ConcordiumPairingStatus.SUCCESS,
        sessionTopic: "test-topic",
      });
    });

    await waitFor(() => {
      expect(result.current.pairStatus).toBe(PairStatus.SUCCESS);
      expect(onPaired).toHaveBeenCalledTimes(1);
    });
  });

  it("should transition to ERROR on ERROR event", async () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing(currency, onPaired));

    act(() => {
      pairingSubject.next({
        status: ConcordiumPairingStatus.ERROR,
      });
    });

    await waitFor(() => {
      expect(result.current.pairStatus).toBe(PairStatus.ERROR);
    });
  });

  it("should transition to ERROR on observable error", async () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing(currency, onPaired));

    act(() => {
      pairingSubject.error(new Error("connection failed"));
    });

    await waitFor(() => {
      expect(result.current.pairStatus).toBe(PairStatus.ERROR);
    });
  });

  it("should unsubscribe on unmount", () => {
    const onPaired = jest.fn();
    const { unmount } = renderHook(() => usePairing(currency, onPaired));

    expect(pairingSubject.observed).toBe(true);

    act(() => {
      unmount();
    });

    expect(pairingSubject.observed).toBe(false);
  });
});
