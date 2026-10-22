import { useRef } from "react";
import { act, renderHook } from "@tests/test-renderer";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import type { SignedOperation } from "@ledgerhq/types-live";
import { ExchangeDeviceSession } from "../../session/exchangeDeviceSession";
import type {
  ExchangeSessionCompleteRequest,
  ExchangeSessionStartRequest,
} from "../../session/types";
import { useExchangeDeviceSession } from "../../session/useExchangeDeviceSession";
import type { ExchangeIntentDefinitions } from "./types";
import { useExchangeDeviceExecutorViewModel } from "./useExchangeDeviceExecutorViewModel";

const mockBroadcast = jest.fn(() => new Promise(() => {}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("~/datadog", () => ({ broadcastLogger: jest.fn() }));

// The renderers pull in the whole design system: the orchestration only needs their identity.
jest.mock("../../deviceIntents/startExchangeIntent/intentPlatformDefinition", () => ({
  startExchangeIntentPlatformDefinition: { label: "default start" },
}));
jest.mock("../../deviceIntents/completeExchangeIntent/intentPlatformDefinition", () => ({
  completeExchangeIntentPlatformDefinition: { label: "default complete" },
}));
jest.mock("../../deviceIntents/showExchangeErrorIntent/intentPlatformDefinition", () => ({
  showExchangeErrorIntentPlatformDefinition: { label: "default error" },
}));

function definition(label: string) {
  return {
    label,
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: jest.fn(),
    component: () => null,
  };
}

const definitions = {
  start: definition("start"),
  complete: definition("complete"),
  error: definition("error"),
} as unknown as ExchangeIntentDefinitions;

const manifest = { id: "swap-live-app", name: "Swap" };
const initializationInput = { appName: "Exchange" } as unknown as InitializationInput;
const signedOperation = { operation: { id: "op" } } as unknown as SignedOperation;
const fromAccount = { type: "Account", id: "from" };
const exchange = {
  fromAccount,
  fromParentAccount: undefined,
  toAccount: { type: "Account", id: "to" },
};

function startRequest(exchangeType = "SWAP"): ExchangeSessionStartRequest {
  return {
    manifest,
    exchangeParams: { exchangeType, provider: "changelly", exchange },
    continuesOnDevice: true,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  } as unknown as ExchangeSessionStartRequest;
}

function completeRequest(overrides: Record<string, unknown> = {}): ExchangeSessionCompleteRequest {
  return {
    manifest,
    exchangeParams: {
      exchangeType: 0,
      provider: "changelly",
      exchange,
      transaction: { family: "bitcoin" },
      binaryPayload: "payload",
      signature: "signature",
      sponsored: true,
      ...overrides,
    },
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  } as unknown as ExchangeSessionCompleteRequest;
}

function setup() {
  const store = new ExchangeDeviceSession(async () => initializationInput);
  return { store };
}

/** The drawer unmounts once the session closes: keep the last session so tests can still read. */
async function renderViewModel(store: ExchangeDeviceSession) {
  return renderHook(() => {
    const session = useExchangeDeviceSession(store);
    const lastSession = useRef(session);
    if (session) lastSession.current = session;
    if (!lastSession.current) throw new Error("The session was never open");
    return useExchangeDeviceExecutorViewModel({ session: lastSession.current, store, definitions });
  });
}

describe("useExchangeDeviceExecutorViewModel", () => {
  it.each([
    ["SWAP", "swap"],
    ["SELL", "buy/sell"],
    ["FUND", "wallet_api"],
  ])("attributes the device flow of a %s start to %s", async (exchangeType, sourceFlow) => {
    const { store } = setup();
    await store.requestStart(startRequest(exchangeType));

    const { result } = await renderViewModel(store);

    expect(result.current.sourceFlow).toBe(sourceFlow);
  });

  it.each([
    [0x00, "swap"],
    [0x01, "buy/sell"],
    [0x02, "wallet_api"],
  ])(
    "attributes the device flow of a complete of type %s to %s",
    async (exchangeType, sourceFlow) => {
      const { store } = setup();
      await store.requestComplete(completeRequest({ exchangeType }));

      const { result } = await renderViewModel(store);

      expect(result.current.sourceFlow).toBe(sourceFlow);
    },
  );

  it("keeps the flow of the session while it shows an error", async () => {
    const { store } = setup();
    await store.requestComplete(completeRequest({ exchangeType: 0x01 }));
    const { result } = await renderViewModel(store);

    act(() => result.current.onIntentJobError(new Error("unexpected")));

    expect(store.getSnapshot()?.phase.step).toBe("error");
    expect(result.current.sourceFlow).toBe("buy/sell");
  });

  it("runs the start intent first, on the session's initialization input", async () => {
    const { store } = setup();
    await store.requestStart(startRequest());

    const { result } = await renderViewModel(store);

    expect(result.current.deviceInitializationInput).toBe(initializationInput);
    expect(result.current.intent).toEqual(
      expect.objectContaining({
        label: "start",
        input: { exchangeType: 0, provider: "changelly", exchange },
      }),
    );
  });

  it("moves on only once the job completed, and keeps the last intent while nothing runs", async () => {
    const { store } = setup();
    const start = startRequest();
    await store.requestStart(start);
    const { result } = await renderViewModel(store);
    const startIntent = result.current.intent;

    act(() => {
      startIntent?.onResult?.({ status: "started", nonce: "nonce-1" } as never);
    });
    expect(start.onSuccess).not.toHaveBeenCalled();

    act(() => result.current.onIntentJobComplete());

    expect(start.onSuccess).toHaveBeenCalledWith("nonce-1", undefined, {});
    expect(store.getSnapshot()?.phase.step).toBe("awaiting-complete");
    // The executor is told nothing changed: it stays idle on what the start intent showed.
    expect(result.current.intent).toBe(startIntent);
  });

  it("swaps the intent for each step while the initialization input and analytics properties stay the same", async () => {
    const { store } = setup();
    await store.requestStart(startRequest());
    const { result } = await renderViewModel(store);
    const analyticsProperties = result.current.analyticsProperties;
    expect(analyticsProperties).toEqual({ manifestId: "swap-live-app", manifestName: "Swap" });
    act(() => {
      result.current.intent?.onResult?.({ status: "started", nonce: "nonce-1" } as never);
    });
    act(() => result.current.onIntentJobComplete());

    await act(() => store.requestComplete(completeRequest()));

    const confirmIntent = result.current.intent;
    expect(confirmIntent).toEqual(
      expect.objectContaining({
        label: "complete",
        input: expect.objectContaining({
          exchangeType: 0,
          provider: "changelly",
          exchange,
          binaryPayload: "payload",
          signature: "signature",
          sponsored: true,
        }),
      }),
    );
    expect(result.current.deviceInitializationInput).toBe(initializationInput);
    expect(result.current.analyticsProperties).toBe(analyticsProperties);

    act(() => {
      confirmIntent?.onResult?.({ status: "signed", signedOperation });
    });
    act(() => result.current.onIntentJobComplete());

    // The executor stays idle on the confirmation's last state while the operation is broadcast.
    expect(store.getSnapshot()?.phase.step).toBe("broadcast");
    expect(result.current.intent).toBe(confirmIntent);
    expect(result.current.deviceInitializationInput).toBe(initializationInput);
    expect(result.current.analyticsProperties).toBe(analyticsProperties);
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);
  });

  it("ignores what an intent reports once the flow has left its phase", async () => {
    const { store } = setup();
    const start = startRequest();
    await store.requestStart(start);
    const { result } = await renderViewModel(store);
    const staleIntent = result.current.intent;
    act(() => {
      staleIntent?.onResult?.({ status: "started", nonce: "nonce-1" } as never);
    });
    act(() => result.current.onIntentJobComplete());
    await act(() => store.requestComplete(completeRequest()));

    act(() => {
      staleIntent?.onResult?.({ status: "started", nonce: "late" } as never);
    });

    expect(start.onSuccess).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()?.phase.step).toBe("confirm");
  });

  it("rejects the pending request when the user closes the drawer", async () => {
    const { store } = setup();
    const start = startRequest();
    await store.requestStart(start);
    const { result } = await renderViewModel(store);

    act(() => result.current.onUserCancel());

    expect(start.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DrawerClosedError" }),
    );
    expect(store.getSnapshot()).toBeNull();
  });

  it("ends the exchange when the device disconnects after the nonce, and ignores other states", async () => {
    const { store } = setup();
    await store.requestStart(startRequest());
    const { result } = await renderViewModel(store);
    act(() => {
      result.current.intent?.onResult?.({ status: "started", nonce: "nonce-1" } as never);
    });
    act(() => result.current.onIntentJobComplete());
    const complete = completeRequest();
    await act(() => store.requestComplete(complete));

    act(() => result.current.onExecutorStateChanged({ type: "idle" }));
    expect(store.getSnapshot()?.phase.step).toBe("confirm");

    act(() =>
      result.current.onExecutorStateChanged({ type: "deviceDisconnected", device: {} as never }),
    );

    expect(complete.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DisconnectedDeviceDuringOperation" }),
    );
    expect(store.getSnapshot()).toBeNull();
  });

  it("does not close a session other than its own when the user closes the drawer", async () => {
    const { store } = setup();
    await store.requestStart(startRequest());
    const { result } = await renderViewModel(store);
    const oldDrawerClose = result.current.onUserCancel;
    const replacement = startRequest();
    await act(() => store.requestStart(replacement));

    act(() => oldDrawerClose());

    expect(replacement.onCancel).not.toHaveBeenCalled();
    expect(store.getSnapshot()).not.toBeNull();
  });

  it("shows an error with the intent of the error phase, in the same executor", async () => {
    const { store } = setup();
    const complete = completeRequest();
    await store.requestComplete(complete);
    const { result } = await renderViewModel(store);
    const error = new Error("payout address rejected");

    act(() => {
      result.current.intent?.onResult?.({
        status: "failed",
        error,
        deviceModelId: "nanoS",
      } as never);
    });
    act(() => result.current.onIntentJobComplete());

    expect(complete.onCancel).toHaveBeenCalledWith(error);
    expect(result.current.intent).toEqual(
      expect.objectContaining({
        label: "error",
        input: expect.objectContaining({ error, provider: "changelly", deviceModelId: "nanoS" }),
      }),
    );
    expect(result.current.deviceInitializationInput).toBe(initializationInput);
  });

  it("swaps the shown error for the one reported later, on the same initialization input", async () => {
    const { store } = setup();
    await store.requestStart(startRequest());
    const { result } = await renderViewModel(store);
    act(() => {
      result.current.intent?.onResult?.({ status: "started", nonce: "nonce-1" } as never);
    });
    act(() => result.current.onIntentJobComplete());
    const firstIntent = result.current.intent;
    const error = new Error("payload not found");

    act(() => {
      store.showError(manifest.id, error);
    });

    expect(result.current.intent).not.toBe(firstIntent);
    expect(result.current.intent).toEqual(
      expect.objectContaining({ label: "error", input: { error } }),
    );
    expect(result.current.deviceInitializationInput).toBe(initializationInput);
  });

  it("ends the flow when a job errors instead of reporting a state", async () => {
    const { store } = setup();
    const complete = completeRequest();
    await store.requestComplete(complete);
    const { result } = await renderViewModel(store);
    const error = new Error("unexpected");

    act(() => result.current.onIntentJobError(error));

    expect(complete.onCancel).toHaveBeenCalledWith(error);
    expect(result.current.intent).toEqual(
      expect.objectContaining({ label: "error", input: expect.objectContaining({ error }) }),
    );
  });
});
