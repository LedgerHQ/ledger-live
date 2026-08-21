import type { Account, AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { usePayTabVerifyAddress, type PayVerifySelection } from "../usePayTabVerifyAddress";

const SELECTION: PayVerifySelection = {
  account: { type: "TokenAccount" } as unknown as AccountLike,
  parentAccount: { type: "Account" } as unknown as Account,
};

function renderVerifyAddress(ldmkEnabled = false) {
  return renderHook(() => usePayTabVerifyAddress(undefined), {
    initialState: withFlagOverrides({ ldmkTransport: { enabled: ldmkEnabled } }),
  });
}

describe("usePayTabVerifyAddress", () => {
  it("should start hidden with resolved copy", () => {
    const { result } = renderVerifyAddress();

    expect(result.current.phase).toBe("hidden");
    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.verifyAddress.labels.introTitle).toBe("Verify your address");
    expect(result.current.verifyAddress.labels.verifyCta).toBe("Verify address");
    expect(result.current.deviceIntent.active).toBe(false);
  });

  it("should open the intro phase and stash the selection", () => {
    const { result } = renderVerifyAddress();

    act(() => result.current.openIntro(SELECTION));

    expect(result.current.phase).toBe("intro");
    expect(result.current.deviceIntent.selection).toEqual(SELECTION);
  });

  it("mounts the DIE but keeps the intro visible until the executor is ready", () => {
    const { result, store } = renderVerifyAddress(true);

    act(() => result.current.openIntro(SELECTION));
    act(() => result.current.verifyAddress.onVerify());

    // Intro stays up (no blank gap) while the DIE initializes.
    expect(result.current.phase).toBe("intro");
    expect(result.current.deviceIntent.active).toBe(true);
    expect(result.current.deviceIntent.selection).toEqual(SELECTION);
    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();

    // Once the executor dialog is up, the intro steps aside; DIE stays mounted.
    act(() => result.current.deviceIntent.onReady());
    expect(result.current.phase).toBe("hidden");
    expect(result.current.deviceIntent.active).toBe(true);
  });

  it("opens the legacy Receive modal and restores the card on verify when ldmkTransport is disabled", () => {
    const onDone = jest.fn();
    const { result, store } = renderVerifyAddress(false);

    act(() => result.current.openIntro(SELECTION, onDone));
    act(() => result.current.verifyAddress.onVerify());

    expect(result.current.phase).toBe("hidden");
    expect(result.current.deviceIntent.active).toBe(false);
    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: {
        account: SELECTION.account,
        parentAccount: SELECTION.parentAccount,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("does nothing on verify when no selection was made", () => {
    const { result, store } = renderVerifyAddress(true);

    act(() => result.current.verifyAddress.onVerify());

    expect(result.current.deviceIntent.active).toBe(false);
    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();
  });

  it.each(["verified", "cancelled", "unsupported", "dismissed", "initFailed"] as const)(
    "brings the receive summary back when the device flow exits with %s",
    outcome => {
      const onDone = jest.fn();
      const { result } = renderVerifyAddress(true);

      act(() => result.current.openIntro(SELECTION, onDone));
      act(() => result.current.verifyAddress.onVerify());
      act(() => result.current.deviceIntent.onExit(outcome));

      expect(result.current.phase).toBe("hidden");
      expect(result.current.deviceIntent.active).toBe(false);
      expect(onDone).toHaveBeenCalledTimes(1);
    },
  );

  it("closes the whole flow without restoring the card on mismatch", () => {
    const onDone = jest.fn();
    const { result } = renderVerifyAddress(true);

    act(() => result.current.openIntro(SELECTION, onDone));
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.deviceIntent.onExit("mismatch"));

    expect(result.current.phase).toBe("hidden");
    expect(result.current.deviceIntent.active).toBe(false);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("consumes the restore callback at most once across repeated exits", () => {
    const onDone = jest.fn();
    const { result } = renderVerifyAddress(true);

    act(() => result.current.openIntro(SELECTION, onDone));
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.deviceIntent.onExit("verified"));
    act(() => result.current.deviceIntent.onExit("dismissed"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("brings the receive summary back when the intro overlay is dismissed", () => {
    const onDone = jest.fn();
    const { result, store } = renderVerifyAddress();

    act(() => result.current.openIntro(SELECTION, onDone));
    act(() => result.current.verifyAddress.onClose());

    expect(result.current.deviceIntent.active).toBe(false);
    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("hides the overlay from the success CTA and on close", () => {
    const { result } = renderVerifyAddress();

    act(() => result.current.openIntro(SELECTION));
    act(() => result.current.verifyAddress.onClose());
    expect(result.current.phase).toBe("hidden");

    act(() => result.current.openIntro(SELECTION));
    act(() => result.current.verifyAddress.onGotIt());
    expect(result.current.phase).toBe("hidden");
  });
});
