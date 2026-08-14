/**
 * @jest-environment jsdom
 */
import { Observable, Subject } from "rxjs";
import { renderHook, act } from "@testing-library/react";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";

// The device-connection half is a whole state machine of its own; this test only cares that
// the sign prompt appeared, so it is pinned to "device ready". The state object is a single
// stable instance: `device` is a dependency of the signing effect, so a fresh object per
// render would resubscribe on every render and drop events.
const READY = {
  device: { deviceId: "device", modelId: "nanoX" },
  opened: true,
  inWrongDeviceForAccount: null,
  error: null,
};
const DEVICE_GONE = { ...READY, opened: false };
// Mutable so a test can take the device away mid-flow. Held as one object per state rather than
// rebuilt per render: `device` is a dependency of the signing effect, so a fresh object each
// render would resubscribe every render and drop events.
const appState = { current: READY as typeof READY };

jest.mock("./app", () => ({
  createAction: () => ({ useHook: () => appState.current, mapResult: () => null }),
}));

const signOperation = jest.fn();
jest.mock("../../bridge", () => ({
  getAccountBridge: async () => ({ signOperation }),
}));

import { createAction } from "./transaction";
import {
  ErrorCategory,
  resetTransactionObservers,
  setTransactionObserver,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";

const account = {
  id: "acc",
  type: "Account",
  currency: { id: "cardano", family: "cardano", ticker: "ADA" },
} as unknown as Account;

const txRequest = {
  account,
  parentAccount: null,
  transaction: { family: "cardano", mode: "delegate", poolId: "pool1" },
  appName: "Cardano ADA",
} as never;

describe("transaction device action — sign-prompt abandonment", () => {
  let events: LogEvent[];
  let signEvents: Subject<SignOperationEvent>;

  beforeEach(() => {
    appState.current = READY;
    resetTransactionObservers();
    events = [];
    setTransactionObserver(e => events.push(e));
    signEvents = new Subject<SignOperationEvent>();
    signOperation.mockReturnValue(
      new Observable<SignOperationEvent>(subscriber => signEvents.subscribe(subscriber)),
    );
  });
  afterEach(() => resetTransactionObservers());

  const render = () => renderHook(() => createAction(jest.fn() as never).useHook(null, txRequest));

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it("reports a dismissal when the prompt was shown and the user left", async () => {
    const { unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));
    unmount();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: "failure",
      stage: TransactionStage.Sign,
      errorCategory: ErrorCategory.UserModalDismissed,
      earnTransactionType: "delegate",
      validators: ["pool1"],
    });
  });

  it("reports nothing when the user signed before leaving", async () => {
    const { result, unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));
    act(() =>
      signEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    expect(result.current.signedOperation).toBeTruthy();
    unmount();

    expect(events).toHaveLength(0);
  });

  it("reports nothing when signing errored — the bridge seam already covered it", async () => {
    const { unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));
    act(() => signEvents.error(Object.assign(new Error(""), { name: "UserRefusedOnDevice" })));
    unmount();

    expect(events).toHaveLength(0);
  });

  // Copilot caught this: passing the main account for both fields dropped token attribution,
  // so an abandoned USDC staking prompt reported only the chain.
  it("keeps token attribution when the signing account is a token account", async () => {
    const tokenAccount = {
      id: "token-acc",
      type: "TokenAccount",
      parentId: "acc",
      token: { id: "ethereum/erc20/usdc", ticker: "USDC" },
    } as never;

    const { unmount } = renderHook(() =>
      createAction(jest.fn() as never).useHook(null, {
        ...(txRequest as unknown as Record<string, unknown>),
        account: tokenAccount,
        parentAccount: account,
      } as never),
    );
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));
    unmount();

    expect(events[0]).toMatchObject({
      tokenId: "ethereum/erc20/usdc",
      tokenTicker: "USDC",
      // The chain still comes from the main account.
      currencyId: "cardano",
    });
  });

  // A device unplugged after the prompt appeared is not the user declining. Reporting it as
  // user_modal_dismissed would put a device failure in the wrong bucket, and the bridge seam
  // already reports the transport error itself.
  it("does not report a dismissal when the device became unavailable", async () => {
    const { rerender, unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));

    appState.current = DEVICE_GONE;
    await act(async () => {
      rerender();
      await Promise.resolve();
    });
    unmount();

    expect(events).toHaveLength(0);
  });

  it("reports nothing when the prompt never appeared", async () => {
    const { unmount } = render();
    await flush();

    unmount();

    expect(events).toHaveLength(0);
  });
});
