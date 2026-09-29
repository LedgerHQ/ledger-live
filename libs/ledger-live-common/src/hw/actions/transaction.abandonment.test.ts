/**
 * @jest-environment jsdom
 */
import { Observable, Subject } from "rxjs";
import { renderHook, act } from "@testing-library/react";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";

// The device-connection half is a whole state machine of its own; this test only cares that
// the sign prompt appeared, so it is pinned to "device ready".
const READY = {
  device: { deviceId: "device", modelId: "nanoX" },
  opened: true,
  inWrongDeviceForAccount: null,
  error: null,
};
type AppStateFixture = Omit<typeof READY, "inWrongDeviceForAccount"> & {
  inWrongDeviceForAccount: { accountName: string } | null;
};
const DEVICE_GONE: AppStateFixture = { ...READY, opened: false };
const WRONG_DEVICE: AppStateFixture = {
  ...READY,
  inWrongDeviceForAccount: { accountName: "Staking account" },
};
// Mutable so a test can take the device away mid-flow.
const appState = { current: READY as AppStateFixture };

jest.mock("./app", () => ({
  createAction: () => ({ useHook: () => appState.current, mapResult: () => null }),
}));

const signOperation = jest.fn();
const signRawOperation = jest.fn();
jest.mock("../../bridge", () => ({
  getAccountBridge: async () => ({ signOperation, signRawOperation }),
}));

import { createAction } from "./transaction";
import { createAction as createRawAction } from "./rawTransaction";
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
  let rawSignEvents: Subject<SignOperationEvent>;

  beforeEach(() => {
    appState.current = READY;
    resetTransactionObservers();
    events = [];
    setTransactionObserver(e => events.push(e));
    signEvents = new Subject<SignOperationEvent>();
    signOperation.mockClear();
    signOperation.mockReturnValue(
      new Observable<SignOperationEvent>(subscriber => signEvents.subscribe(subscriber)),
    );
    rawSignEvents = new Subject<SignOperationEvent>();
    signRawOperation.mockClear();
    signRawOperation.mockReturnValue(
      new Observable<SignOperationEvent>(subscriber => rawSignEvents.subscribe(subscriber)),
    );
  });
  afterEach(() => resetTransactionObservers());

  const render = () => renderHook(() => createAction(jest.fn() as never).useHook(null, txRequest));
  const renderRaw = () =>
    renderHook(() =>
      createRawAction(jest.fn() as never).useHook(null, {
        account,
        parentAccount: null,
        transaction: "{}",
        manifestId: "stakekit",
        manifestName: "StakeKit",
      }),
    );

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
      abandoned: true,
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

  it("classifies an interrupted started attempt as a device error", async () => {
    const { rerender, unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));

    appState.current = DEVICE_GONE;
    await act(async () => {
      rerender();
      await Promise.resolve();
    });
    unmount();

    expect(events).toEqual([
      expect.objectContaining({
        status: "failure",
        errorCategory: ErrorCategory.DeviceDisconnected,
        operationalOnly: true,
      }),
    ]);
  });

  it("does not close a dapp or native attempt when the wrong account is connected before signing", async () => {
    appState.current = WRONG_DEVICE;
    const { unmount } = render();
    await flush();
    unmount();

    expect(events).toEqual([]);
  });

  it("classifies a wrong account after signing starts as a device error", async () => {
    const { rerender, unmount } = render();
    await flush();

    act(() => signEvents.next({ type: "device-signature-requested" }));

    appState.current = WRONG_DEVICE;
    await act(async () => {
      rerender();
      await Promise.resolve();
    });
    unmount();

    expect(events).toEqual([
      expect.objectContaining({
        status: "failure",
        errorCategory: ErrorCategory.DeviceWrongAccount,
        operationalOnly: true,
      }),
    ]);
  });

  it("closes a started attempt even when the prompt never appeared", async () => {
    const { unmount } = render();
    await flush();

    unmount();

    expect(events).toEqual([
      expect.objectContaining({
        status: "failure",
        errorCategory: ErrorCategory.UserModalDismissed,
        abandoned: true,
        operationalOnly: true,
      }),
    ]);
  });

  it("provides the live-app manifest to the deferred mobile sign call", async () => {
    let capturedManifestId: string | null | undefined;
    signOperation.mockImplementation(() => {
      capturedManifestId = liveBlindSigningReporter.getContext().liveAppContext;
      return signEvents;
    });

    renderHook(() =>
      createAction(jest.fn() as never).useHook(null, {
        ...(txRequest as unknown as Record<string, unknown>),
        manifestId: "stakekit",
        manifestName: "StakeKit",
      } as never),
    );
    await flush();

    expect(capturedManifestId).toBe("stakekit");
  });

  it("reports raw-sign prompt dismissal as an abandoned dapp attempt", async () => {
    const { unmount } = renderRaw();
    await flush();

    act(() => rawSignEvents.next({ type: "device-signature-requested" }));
    unmount();

    expect(events).toEqual([
      expect.objectContaining({
        status: "failure",
        manifestId: "stakekit",
        errorCategory: ErrorCategory.UserModalDismissed,
        abandoned: true,
        operationalOnly: false,
      }),
    ]);
  });

  it("does not abandon a completed raw signature", async () => {
    const { unmount } = renderRaw();
    await flush();

    act(() =>
      rawSignEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    unmount();

    expect(events).toEqual([]);
  });

  it("preserves the sign subscription when the device object identity changes", async () => {
    const { rerender, unmount } = render();
    await flush();
    act(() => signEvents.next({ type: "device-signature-requested" }));
    expect(signOperation).toHaveBeenCalledTimes(1);

    appState.current = {
      ...READY,
      device: { deviceId: "device", modelId: "nanoX" },
    };
    await act(async () => {
      rerender();
      await Promise.resolve();
    });

    expect(events).toEqual([]);
    expect(signOperation).toHaveBeenCalledTimes(1);

    act(() =>
      signEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    unmount();
    expect(events).toEqual([]);
  });

  it("signs a structured transaction with a mock device, whose id is an empty string", async () => {
    appState.current = { ...READY, device: { deviceId: "", modelId: "nanoX" } };
    const { unmount } = render();
    await flush();

    expect(signOperation).toHaveBeenCalledWith(expect.objectContaining({ deviceId: "" }));

    act(() =>
      signEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    unmount();
    expect(events).toEqual([]);
  });

  it("preserves the raw-sign subscription when the device object identity changes", async () => {
    const { rerender, unmount } = renderRaw();
    await flush();
    act(() => rawSignEvents.next({ type: "device-signature-requested" }));
    expect(signRawOperation).toHaveBeenCalledTimes(1);

    appState.current = {
      ...READY,
      device: { deviceId: "device", modelId: "nanoX" },
    };
    await act(async () => {
      rerender();
      await Promise.resolve();
    });

    expect(events).toEqual([]);
    expect(signRawOperation).toHaveBeenCalledTimes(1);

    act(() =>
      rawSignEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    unmount();
    expect(events).toEqual([]);
  });

  it("signs with a mock device, whose id is an empty string", async () => {
    appState.current = { ...READY, device: { deviceId: "", modelId: "nanoX" } };
    const { unmount } = renderRaw();
    await flush();

    expect(signRawOperation).toHaveBeenCalledWith(expect.objectContaining({ deviceId: "" }));

    act(() =>
      rawSignEvents.next({
        type: "signed",
        signedOperation: { signature: "sig", operation: {} },
      } as SignOperationEvent),
    );
    unmount();
    expect(events).toEqual([]);
  });

  it("keeps token attribution on raw-sign abandonment", async () => {
    const tokenAccount = {
      id: "token-acc",
      type: "TokenAccount",
      parentId: "acc",
      token: { id: "ethereum/erc20/usdc", ticker: "USDC" },
    } as never;
    const { unmount } = renderHook(() =>
      createRawAction(jest.fn() as never).useHook(null, {
        account: tokenAccount,
        parentAccount: account,
        transaction: "{}",
        manifestId: "stakekit",
      }),
    );
    await flush();
    act(() => rawSignEvents.next({ type: "device-signature-requested" }));
    unmount();

    expect(events[0]).toMatchObject({
      tokenId: "ethereum/erc20/usdc",
      tokenTicker: "USDC",
      currencyId: "cardano",
    });
  });

  it("classifies an interrupted raw-sign attempt as a device error", async () => {
    const { rerender, unmount } = renderRaw();
    await flush();
    act(() => rawSignEvents.next({ type: "device-signature-requested" }));

    appState.current = DEVICE_GONE;
    await act(async () => {
      rerender();
      await Promise.resolve();
    });
    unmount();

    expect(events).toEqual([
      expect.objectContaining({
        status: "failure",
        manifestId: "stakekit",
        errorCategory: ErrorCategory.DeviceDisconnected,
        operationalOnly: true,
      }),
    ]);
  });
});
