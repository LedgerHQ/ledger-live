import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { DrawerClosedError } from "../errors";
import { ExchangeDeviceSession } from "../exchangeDeviceSession";
import type {
  ExchangeSession,
  ExchangeSessionCompleteRequest,
  ExchangeSessionPhase,
  ExchangeSessionStartRequest,
} from "../types";

type Phase<Step extends ExchangeSessionPhase["step"]> = Extract<
  ExchangeSessionPhase,
  { step: Step }
>;

const deviceModelId = DeviceModelId.nanoX;
const swapManifest = { id: "swap-live-app", name: "Swap" };
const device = { deviceId: "device-1", modelId: "nanoX", wired: true, deviceName: "Nano" };
const signedOperation = { operation: { id: "op" } } as unknown as SignedOperation;
const operation = { id: "op", hash: "0xhash" } as unknown as Operation;

const signatureError = new CompleteExchangeError(
  "CHECK_TRANSACTION_SIGNATURE",
  "signVerificationFail",
  "Signature verification failed",
);

let initializationInputs: InitializationInput[];

function deferred<T>() {
  const handlers: { resolve?: (value: T) => void } = {};
  const promise = new Promise<T>(resolve => {
    handlers.resolve = resolve;
  });
  return { promise, resolve: (value: T) => handlers.resolve?.(value) };
}

function createStore(
  build: (exchange: unknown) => Promise<InitializationInput> = async () => {
    const input = { appName: "Exchange" } as unknown as InitializationInput;
    initializationInputs.push(input);
    return input;
  },
) {
  return new ExchangeDeviceSession(build);
}

function startRequest(overrides: Partial<ExchangeSessionStartRequest> = {}) {
  const request = {
    manifest: swapManifest,
    exchangeParams: { exchangeType: "SWAP", provider: "changelly", exchange: {} },
    continuesOnDevice: true,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  } as unknown as ExchangeSessionStartRequest;
  return request;
}

function completeRequest(
  exchangeParams: Record<string, unknown> = {},
  overrides: Partial<ExchangeSessionCompleteRequest> = {},
) {
  return {
    manifest: swapManifest,
    exchangeParams: { provider: "changelly", exchange: {}, ...exchangeParams },
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  } as unknown as ExchangeSessionCompleteRequest;
}

function phaseOf<Step extends ExchangeSessionPhase["step"]>(
  store: ExchangeDeviceSession,
  step: Step,
): Phase<Step> {
  const phase = store.getSnapshot()?.phase;
  if (phase?.step !== step) {
    throw new Error(`Expected the session to be in "${step}", got "${phase?.step}"`);
  }
  // `phase.step` was narrowed on the check above, but TS cannot carry it through `Extract`.
  return phase as Phase<Step>;
}

/** Runs the start step the way the drawer does: the job reports, then completes. */
function finishStart(store: ExchangeDeviceSession, nonce = "nonce-1") {
  const phase = phaseOf(store, "start");
  store.recordStartResult(phase, {
    status: "started",
    nonce,
    device,
    exchangeAppVersion: "3.5.0",
    signingAppName: "Bitcoin",
    signingAppVersion: "2.4.0",
  } as never);
  store.completePhase(phase);
}

/** Runs the confirm step through to the signature of the coin app. */
function finishConfirm(store: ExchangeDeviceSession) {
  const phase = phaseOf(store, "confirm");
  store.recordConfirmResult(phase, { status: "signed", signedOperation });
  store.completePhase(phase);
}

describe("ExchangeDeviceSession", () => {
  beforeEach(() => {
    initializationInputs = [];
  });

  describe("a swap, from the nonce to the broadcast", () => {
    it("runs every step on one device preparation and answers each hook", async () => {
      const store = createStore();
      const start = startRequest();
      const complete = completeRequest();

      await store.requestStart(start);
      expect(store.getSnapshot()?.manifest).toEqual(swapManifest);
      expect(phaseOf(store, "start").request).toBe(start);

      finishStart(store);
      expect(phaseOf(store, "awaiting-complete")).toBeDefined();
      expect(start.onSuccess).toHaveBeenCalledWith("nonce-1", device, {
        exchangeAppVersion: "3.5.0",
        signingAppName: "Bitcoin",
        signingAppVersion: "2.4.0",
      });

      await store.requestComplete(complete);
      expect(phaseOf(store, "confirm").request).toBe(complete);

      finishConfirm(store);
      const broadcastPhase = phaseOf(store, "broadcast");
      expect(broadcastPhase.signedOperation).toBe(signedOperation);

      store.broadcastSucceeded(broadcastPhase, operation);
      expect(complete.onSuccess).toHaveBeenCalledWith(operation);
      expect(store.getSnapshot()).toBeNull();
      expect(start.onCancel).not.toHaveBeenCalled();
      expect(complete.onCancel).not.toHaveBeenCalled();
      expect(initializationInputs).toHaveLength(1);
    });

    it("keeps the same initialization input from the start to the signature", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const input = store.getSnapshot()?.initializationInput;

      finishStart(store);
      await store.requestComplete(completeRequest());
      expect(store.getSnapshot()?.initializationInput).toBe(input);
      finishConfirm(store);
      expect(store.getSnapshot()?.initializationInput).toBe(input);
    });

    it("closes before answering the broadcast, so the answer cannot reject itself", async () => {
      const store = createStore();
      let snapshotWhenAnswered: ExchangeSession | null | undefined;
      const complete = completeRequest(
        {},
        {
          onSuccess: jest.fn(() => {
            snapshotWhenAnswered = store.getSnapshot();
          }),
        },
      );
      await store.requestComplete(complete);
      finishConfirm(store);

      store.broadcastSucceeded(phaseOf(store, "broadcast"), operation);

      expect(complete.onSuccess).toHaveBeenCalledTimes(1);
      expect(snapshotWhenAnswered).toBeNull();
    });

    it("tells subscribers about every change", async () => {
      const store = createStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      await store.requestStart(startRequest());
      expect(listener).toHaveBeenCalledTimes(1);
      finishStart(store);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      store.close();
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe("a start that is not followed by a swap", () => {
    it("closes once the nonce is known, for the live app to carry on", async () => {
      const store = createStore();
      const start = startRequest({ continuesOnDevice: false });

      await store.requestStart(start);
      finishStart(store);

      expect(store.getSnapshot()).toBeNull();
      expect(start.onSuccess).toHaveBeenCalledWith("nonce-1", device, expect.anything());
    });

    it("opens a new session for the complete that follows, built on its own exchange", async () => {
      const build = jest.fn(
        async () => ({ appName: "Exchange" }) as unknown as InitializationInput,
      );
      const store = createStore(build);
      const exchange = { fromAccount: { id: "from" } };

      await store.requestStart(startRequest({ continuesOnDevice: false }));
      finishStart(store);
      await store.requestComplete(completeRequest({ exchange }));

      expect(build).toHaveBeenCalledTimes(2);
      expect(build).toHaveBeenLastCalledWith(exchange);
      expect(phaseOf(store, "confirm")).toBeDefined();
    });
  });

  describe("failures", () => {
    it("answers a failed start with the error and the device, and shows the error", async () => {
      const store = createStore();
      const start = startRequest();
      const error = new Error("Incompatible AppExchange version with NG command");

      await store.requestStart(start);
      const id = store.getSnapshot()?.id;
      const phase = phaseOf(store, "start");
      store.recordStartResult(phase, { status: "failed", error, device } as never);
      store.completePhase(phase);

      expect(start.onCancel).toHaveBeenCalledWith(error, device);
      expect(start.onSuccess).not.toHaveBeenCalled();
      expect(phaseOf(store, "error").details).toEqual({ error });
      // The same executor shows it: the session stays open.
      expect(store.getSnapshot()?.id).toBe(id);
    });

    it("answers a confirmation that failed with its error, and shows it with the swap details", async () => {
      const store = createStore();
      const complete = completeRequest({
        provider: "thorswap",
        exchange: { fromCurrency: { id: "bitcoin" }, toCurrency: { id: "ethereum" } },
      });
      const error = new Error("payout address rejected");

      await store.requestComplete(complete);
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "failed", error, deviceModelId });
      store.completePhase(phase);

      expect(complete.onCancel).toHaveBeenCalledWith(error);
      expect(phaseOf(store, "error").details).toEqual({
        error,
        provider: "thorswap",
        deviceModelId,
        sourceCurrencyId: "bitcoin",
        targetCurrencyId: "ethereum",
      });
    });

    it("leaves the destination currency out for a sell or fund", async () => {
      const store = createStore();
      await store.requestComplete(
        completeRequest({ exchange: { fromCurrency: { id: "bitcoin" } } }),
      );
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, {
        status: "failed",
        error: new Error("failed"),
        deviceModelId,
      });
      store.completePhase(phase);

      expect(phaseOf(store, "error").details).not.toHaveProperty("targetCurrencyId");
    });

    it("answers a signature that failed with its error, and shows it without a device", async () => {
      const store = createStore();
      const complete = completeRequest();
      const error = new Error("device locked");

      await store.requestComplete(complete);
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "failed", error });
      store.completePhase(phase);

      expect(complete.onCancel).toHaveBeenCalledWith(error);
      expect(phaseOf(store, "error").details).toEqual(
        expect.objectContaining({ error, provider: "changelly" }),
      );
      expect(phaseOf(store, "error").details).not.toHaveProperty("deviceModelId");
    });

    it("answers a broadcast that failed with its error, and shows it", async () => {
      const store = createStore();
      const complete = completeRequest();
      const error = new Error("network down");

      await store.requestComplete(complete);
      finishConfirm(store);
      store.broadcastFailed(phaseOf(store, "broadcast"), error);

      expect(complete.onCancel).toHaveBeenCalledWith(error);
      expect(complete.onSuccess).not.toHaveBeenCalled();
      expect(phaseOf(store, "error").details).toEqual(expect.objectContaining({ error }));
    });

    it("answers a job that ended without reporting, instead of hanging", async () => {
      const store = createStore();
      const complete = completeRequest();

      await store.requestComplete(complete);
      store.completePhase(phaseOf(store, "confirm"));

      expect(complete.onCancel).toHaveBeenCalledWith(expect.any(Error));
      expect(phaseOf(store, "error")).toBeDefined();
    });

    it("ends the flow when a job errors instead of reporting a state", async () => {
      const store = createStore();
      const complete = completeRequest();
      const error = new Error("unexpected");

      await store.requestComplete(complete);
      store.failPhase(phaseOf(store, "confirm"), error);

      expect(complete.onCancel).toHaveBeenCalledWith(error);
      expect(phaseOf(store, "error").details).toEqual(expect.objectContaining({ error }));
    });

    it("answers the request when the device cannot be prepared, without opening a session", async () => {
      const error = new Error("unknown currency");
      const store = createStore(() => Promise.reject(error));
      const start = startRequest();

      await store.requestStart(start);

      expect(start.onCancel).toHaveBeenCalledWith(error);
      expect(store.getSnapshot()).toBeNull();
    });

    it("has nobody to answer when the user closes the drawer on an error", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      store.failPhase(phaseOf(store, "confirm"), new Error("failed"));
      expect(complete.onCancel).toHaveBeenCalledTimes(1);

      store.userClosed(store.getSnapshot()!.id);

      expect(store.getSnapshot()).toBeNull();
      expect(complete.onCancel).toHaveBeenCalledTimes(1);
    });

    it("lets a new request replace the error that is on screen", async () => {
      const store = createStore();
      await store.requestComplete(completeRequest());
      store.failPhase(phaseOf(store, "confirm"), new Error("failed"));
      const errorSessionId = store.getSnapshot()?.id;

      const next = startRequest();
      await store.requestStart(next);

      expect(phaseOf(store, "start").request).toBe(next);
      expect(store.getSnapshot()?.id).not.toBe(errorSessionId);
    });
  });

  describe("an error reported outside the device steps", () => {
    it("shows it in the drawer that waits between two steps", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);
      const id = store.getSnapshot()?.id;
      const error = new Error("payload not found");

      expect(store.showError(swapManifest.id, error)).toBe(true);

      expect(phaseOf(store, "error").details).toEqual({ error });
      expect(store.getSnapshot()?.id).toBe(id);
    });

    it("replaces the error a step reported, keeping what that step knew", async () => {
      const store = createStore();
      const complete = completeRequest({ provider: "thorswap" });
      await store.requestComplete(complete);
      const confirmPhase = phaseOf(store, "confirm");
      store.recordConfirmResult(confirmPhase, {
        status: "failed",
        error: new Error("first"),
        deviceModelId,
      });
      store.completePhase(confirmPhase);
      const finalError = new Error("final");

      expect(store.showError(swapManifest.id, finalError)).toBe(true);

      expect(phaseOf(store, "error").details).toEqual(
        expect.objectContaining({ error: finalError, provider: "thorswap", deviceModelId }),
      );
    });

    it("leaves the refusal screen alone, because it already tells the user", async () => {
      const store = createStore();
      await store.requestComplete(completeRequest());
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "refused" });
      store.completePhase(phase);
      const refusedPhase = phaseOf(store, "refused");

      expect(store.showError(swapManifest.id, new Error("late"))).toBe(true);

      expect(store.getSnapshot()?.phase).toBe(refusedPhase);
    });

    it("does not touch a step that is running", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const runningPhase = phaseOf(store, "start");

      expect(store.showError(swapManifest.id, new Error("late"))).toBe(false);

      expect(store.getSnapshot()?.phase).toBe(runningPhase);
    });

    it("has no drawer to show it when no session is open", () => {
      const store = createStore();

      expect(store.showError(swapManifest.id, new Error("late"))).toBe(false);
    });

    it("has no drawer to show it when the session belongs to another live app", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);

      expect(store.showError("earn-live-app", new Error("late"))).toBe(false);
      expect(phaseOf(store, "awaiting-complete")).toBeDefined();
    });
  });

  describe("a signature the Exchange app rejects, which executeSwap retries", () => {
    it("keeps the drawer open for the next start, and prepares the device again", async () => {
      const store = createStore();
      const complete = completeRequest({ willRetryOnSignatureError: true });

      await store.requestStart(startRequest());
      const firstInput = store.getSnapshot()?.initializationInput;
      finishStart(store);
      await store.requestComplete(complete);
      const confirmPhase = phaseOf(store, "confirm");
      store.recordConfirmResult(confirmPhase, {
        status: "failed",
        error: signatureError,
        deviceModelId,
      });
      store.completePhase(confirmPhase);

      expect(complete.onCancel).toHaveBeenCalledWith(signatureError);
      expect(phaseOf(store, "awaiting-complete")).toBeDefined();

      const retry = startRequest();
      await store.requestStart(retry);

      expect(phaseOf(store, "start").request).toBe(retry);
      // The input changes together with the phase, which makes the executor prepare the device.
      expect(store.getSnapshot()?.initializationInput).not.toBe(firstInput);
    });

    it("shows the error once no retry is left", async () => {
      const store = createStore();
      const complete = completeRequest({ willRetryOnSignatureError: false });

      await store.requestComplete(complete);
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "failed", error: signatureError, deviceModelId });
      store.completePhase(phase);

      expect(complete.onCancel).toHaveBeenCalledWith(signatureError);
      expect(phaseOf(store, "error").details).toEqual(
        expect.objectContaining({ error: signatureError }),
      );
    });
  });

  describe("a refusal on the device", () => {
    it("waits for the user to close the drawer after a refusal", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);

      finishConfirmRefused(store);

      expect(phaseOf(store, "refused").request).toBe(complete);
      expect(complete.onCancel).not.toHaveBeenCalled();

      store.userClosed();

      expect(complete.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TransactionRefusedOnDevice" }),
      );
      expect(store.getSnapshot()).toBeNull();
    });

    it("answers with the refusal the Exchange app reported, which keeps its step", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      const refusal = new CompleteExchangeError("CHECK_REFUND_ADDRESS", "userRefused");
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "refused", error: refusal });
      store.completePhase(phase);

      store.userClosed();

      expect(complete.onCancel).toHaveBeenCalledWith(refusal);
    });
  });

  describe("closing", () => {
    it("rejects the pending request when the user closes the drawer on a step", async () => {
      const store = createStore();
      const start = startRequest();
      await store.requestStart(start);

      store.userClosed();

      expect(start.onCancel).toHaveBeenCalledWith(expect.any(DrawerClosedError));
      expect(start.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "DrawerClosedError" }),
      );
      expect(store.getSnapshot()).toBeNull();
    });

    it("has nobody to answer when the user closes the drawer while nothing runs", async () => {
      const store = createStore();
      const start = startRequest();
      await store.requestStart(start);
      finishStart(store);

      store.userClosed();

      expect(start.onCancel).not.toHaveBeenCalled();
      expect(store.getSnapshot()).toBeNull();
    });

    it("closes the session of a webview that goes away, and no other", async () => {
      const store = createStore();
      const start = startRequest();
      await store.requestStart(start);

      store.closeForManifest("earn-live-app");
      expect(store.getSnapshot()).not.toBeNull();

      store.closeForManifest(swapManifest.id);
      expect(start.onCancel).toHaveBeenCalledWith(expect.any(DrawerClosedError));
      expect(store.getSnapshot()).toBeNull();
    });

    it("does nothing when there is no session", () => {
      const store = createStore();
      const listener = jest.fn();
      store.subscribe(listener);

      store.userClosed();
      store.close();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("a device that disconnects", () => {
    const disconnection = expect.objectContaining({ name: "DisconnectedDeviceDuringOperation" });

    it("lets the executor retry the start, as no nonce was given yet", async () => {
      const store = createStore();
      const start = startRequest();
      await store.requestStart(start);

      disconnect(store);

      expect(phaseOf(store, "start").request).toBe(start);
      expect(start.onCancel).not.toHaveBeenCalled();
    });

    it("ends a swap waiting for its payload, which then gets a fresh drawer", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);
      const id = store.getSnapshot()?.id;

      disconnect(store);
      expect(store.getSnapshot()).toBeNull();

      const complete = completeRequest();
      await store.requestComplete(complete);

      // Not the disconnected executor, which would replay the start instead.
      expect(store.getSnapshot()?.id).not.toBe(id);
      expect(phaseOf(store, "confirm").request).toBe(complete);
    });

    it("answers a confirmation it interrupted with the disconnection", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);
      const complete = completeRequest();
      await store.requestComplete(complete);

      disconnect(store);

      expect(complete.onCancel).toHaveBeenCalledWith(disconnection);
      expect(store.getSnapshot()).toBeNull();
    });

    it("answers a refusal with the refusal", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      finishConfirmRefused(store);

      disconnect(store);

      expect(complete.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TransactionRefusedOnDevice" }),
      );
    });

    it("answers a broadcast that was not sent yet with the disconnection", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      finishConfirm(store);

      disconnect(store);

      expect(complete.onCancel).toHaveBeenCalledWith(disconnection);
    });

    it("leaves a sent broadcast to answer its request", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      finishConfirm(store);
      const phase = phaseOf(store, "broadcast");
      store.startBroadcast(phase);

      disconnect(store);
      store.broadcastSucceeded(phase, operation);

      expect(complete.onCancel).not.toHaveBeenCalled();
      expect(complete.onSuccess).toHaveBeenCalledWith(operation);
    });

    it("keeps an error on screen", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "failed", error: new Error("failed") });
      store.completePhase(phase);

      disconnect(store);

      expect(phaseOf(store, "error")).toBeDefined();
    });

    it("ignores the disconnection of a drawer that is gone", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);
      const staleId = store.getSnapshot()!.id;
      store.userClosed();
      await store.requestStart(startRequest());
      finishStart(store);

      store.deviceDisconnected(staleId);

      expect(phaseOf(store, "awaiting-complete")).toBeDefined();
    });
  });

  describe("a broadcast that was sent", () => {
    async function sentBroadcast(store: ExchangeDeviceSession) {
      const complete = completeRequest();
      await store.requestComplete(complete);
      finishConfirm(store);
      const phase = phaseOf(store, "broadcast");
      expect(store.startBroadcast(phase)).toBe(true);
      return { complete, phase };
    }

    it("is sent only once", async () => {
      const store = createStore();
      const { phase } = await sentBroadcast(store);

      expect(store.startBroadcast(phase)).toBe(false);
    });

    it("answers its request when a new request replaced the drawer meanwhile", async () => {
      const store = createStore();
      const { complete, phase } = await sentBroadcast(store);
      const next = startRequest();

      await store.requestStart(next);
      expect(complete.onCancel).not.toHaveBeenCalled();

      store.broadcastSucceeded(phase, operation);
      expect(complete.onSuccess).toHaveBeenCalledWith(operation);
      expect(complete.onCancel).not.toHaveBeenCalled();
      // The drawer of the new request is left alone.
      expect(phaseOf(store, "start").request).toBe(next);
    });

    it("answers its request after the webview went away", async () => {
      const store = createStore();
      const { complete, phase } = await sentBroadcast(store);

      store.closeForManifest(swapManifest.id);
      store.broadcastSucceeded(phase, operation);

      expect(complete.onCancel).not.toHaveBeenCalled();
      expect(complete.onSuccess).toHaveBeenCalledWith(operation);
      expect(store.getSnapshot()).toBeNull();
    });

    it("answers its request with the failure once its drawer is gone, without opening one", async () => {
      const store = createStore();
      const { complete, phase } = await sentBroadcast(store);
      const error = new Error("network down");

      store.closeForManifest(swapManifest.id);
      store.broadcastFailed(phase, error);

      expect(complete.onCancel).toHaveBeenCalledTimes(1);
      expect(complete.onCancel).toHaveBeenCalledWith(error);
      expect(store.getSnapshot()).toBeNull();
    });

    it("is not sent, and its request is answered as closed, when the drawer went away first", async () => {
      const store = createStore();
      const complete = completeRequest();
      await store.requestComplete(complete);
      finishConfirm(store);
      const phase = phaseOf(store, "broadcast");

      store.closeForManifest(swapManifest.id);

      expect(complete.onCancel).toHaveBeenCalledWith(expect.any(DrawerClosedError));
      expect(store.startBroadcast(phase)).toBe(false);
    });
  });

  describe("a request while a step is unfinished", () => {
    it.each([
      ["a start", (store: ExchangeDeviceSession, request: never) => store.requestStart(request)],
      [
        "a complete",
        (store: ExchangeDeviceSession, request: never) => store.requestComplete(request),
      ],
    ])(
      "replaces the running step with %s, and answers the old request as closed",
      async (_name, send) => {
        const store = createStore();
        const stale = startRequest();
        await store.requestStart(stale);
        const firstInput = store.getSnapshot()?.initializationInput;
        const replacement = startRequest();

        await send(store, replacement as never);

        // The running job is never handed a new intent: the session is torn down and reopened.
        expect(stale.onCancel).toHaveBeenCalledWith(
          expect.objectContaining({ name: "DrawerClosedError" }),
        );
        expect(replacement.onCancel).not.toHaveBeenCalled();
        expect(store.getSnapshot()?.initializationInput).not.toBe(firstInput);
        expect(store.getSnapshot()?.phase).toEqual(
          expect.objectContaining({ request: replacement }),
        );
      },
    );

    it("closes the drawer between the two, so the executor starts over", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const snapshots: (ExchangeSession | null)[] = [];
      store.subscribe(() => snapshots.push(store.getSnapshot()));

      await store.requestStart(startRequest());

      expect(snapshots.map(snapshot => snapshot?.phase.step ?? null)).toEqual([null, "start"]);
    });

    it("answers the request of a refused step with the refusal when it is replaced", async () => {
      const store = createStore();
      const refused = completeRequest();
      await store.requestComplete(refused);
      const phase = phaseOf(store, "confirm");
      store.recordConfirmResult(phase, { status: "refused" });
      store.completePhase(phase);

      await store.requestStart(startRequest());

      expect(refused.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TransactionRefusedOnDevice" }),
      );
      expect(phaseOf(store, "start")).toBeDefined();
    });

    it("lets the latest request win while the device is still being prepared", async () => {
      const first = deferred<InitializationInput>();
      const second = deferred<InitializationInput>();
      const builds = [first, second];
      const store = createStore(() => builds.shift()!.promise);
      const firstRequest = startRequest();
      const secondRequest = startRequest();

      const firstOpening = store.requestStart(firstRequest);
      const secondOpening = store.requestStart(secondRequest);
      first.resolve({ appName: "first" } as unknown as InitializationInput);
      second.resolve({ appName: "second" } as unknown as InitializationInput);
      await Promise.all([firstOpening, secondOpening]);

      expect(firstRequest.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "DrawerClosedError" }),
      );
      expect(secondRequest.onCancel).not.toHaveBeenCalled();
      expect(phaseOf(store, "start").request).toBe(secondRequest);
      expect(store.getSnapshot()?.initializationInput).toEqual({ appName: "second" });
    });

    it("does not open a session that was closed while the device was being prepared", async () => {
      const building = deferred<InitializationInput>();
      const store = createStore(() => building.promise);
      const request = startRequest();

      const opening = store.requestStart(request);
      store.closeForManifest(swapManifest.id);
      building.resolve({ appName: "Exchange" } as unknown as InitializationInput);
      await opening;

      expect(request.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "DrawerClosedError" }),
      );
      expect(store.getSnapshot()).toBeNull();
    });

    it("keeps the drawer of a session that only waits between two steps", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);
      const snapshots: (ExchangeSession | null)[] = [];
      store.subscribe(() => snapshots.push(store.getSnapshot()));

      await store.requestComplete(completeRequest());

      expect(snapshots.every(snapshot => snapshot !== null)).toBe(true);
    });

    it("hands the drawer over to another live app once nothing runs", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      finishStart(store);

      const other = startRequest({ manifest: { id: "sell-live-app", name: "Sell" } });
      await store.requestStart(other);

      expect(store.getSnapshot()?.manifest.id).toBe("sell-live-app");
      expect(phaseOf(store, "start").request).toBe(other);
    });
  });

  describe("session identity", () => {
    it("keeps the id for every step of a session, so the same executor runs them all", async () => {
      const store = createStore();

      await store.requestStart(startRequest());
      const id = store.getSnapshot()?.id;
      finishStart(store);
      await store.requestComplete(completeRequest());
      finishConfirm(store);

      expect(id).toBeDefined();
      expect(store.getSnapshot()?.id).toBe(id);
    });

    it("keeps the id when an idle session is reused for a new start", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const id = store.getSnapshot()?.id;
      finishStart(store);

      await store.requestStart(startRequest());

      expect(store.getSnapshot()?.id).toBe(id);
    });

    it("gives a new id to a session that replaces an unfinished one, so its drawer starts over", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const firstId = store.getSnapshot()?.id;

      await store.requestStart(startRequest());

      expect(store.getSnapshot()?.id).not.toBe(firstId);
    });

    it("gives a new id to a session opened after the previous one ended", async () => {
      const store = createStore();
      await store.requestStart(startRequest());
      const firstId = store.getSnapshot()?.id;
      store.userClosed();

      await store.requestStart(startRequest());

      expect(store.getSnapshot()?.id).not.toBe(firstId);
    });

    it("ignores a close reported for a session that is no longer open", async () => {
      const store = createStore();
      const first = startRequest();
      await store.requestStart(first);
      const staleId = store.getSnapshot()!.id;
      const second = startRequest();
      await store.requestStart(second);

      // The old drawer's sheet reports its close after the new session opened.
      store.userClosed(staleId);

      expect(store.getSnapshot()?.phase).toEqual(expect.objectContaining({ request: second }));
      expect(second.onCancel).not.toHaveBeenCalled();
    });

    it("closes the session whose id it is given", async () => {
      const store = createStore();
      const request = startRequest();
      await store.requestStart(request);

      store.userClosed(store.getSnapshot()!.id);

      expect(store.getSnapshot()).toBeNull();
      expect(request.onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "DrawerClosedError" }),
      );
    });
  });

  describe("results that are no longer current", () => {
    it("ignores a result and a completion reported for a phase the flow left", async () => {
      const store = createStore();
      const start = startRequest();
      await store.requestStart(start);
      const staleStart = phaseOf(store, "start");
      finishStart(store);
      await store.requestComplete(completeRequest());

      store.recordStartResult(staleStart, { status: "started", nonce: "late", device } as never);
      store.completePhase(staleStart);

      expect(start.onSuccess).toHaveBeenCalledTimes(1);
      expect(phaseOf(store, "confirm")).toBeDefined();
    });
  });
});

/** What the drawer reports when the executor sees its device disconnect. */
function disconnect(store: ExchangeDeviceSession) {
  store.deviceDisconnected(store.getSnapshot()!.id);
}

function finishConfirmRefused(store: ExchangeDeviceSession) {
  const phase = phaseOf(store, "confirm");
  store.recordConfirmResult(phase, { status: "refused" });
  store.completePhase(phase);
}
