import { DisconnectedDeviceDuringOperation } from "@ledgerhq/hw-transport/errors";
import { TransactionRefusedOnDevice } from "@ledgerhq/live-common/errors";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { getIsSwapRetryPending } from "@ledgerhq/live-common/exchange/error";
import {
  buildExchangeAppRequest,
  getExchangeMainAccounts,
  normalizeError,
  type ShowExchangeErrorIntentInput,
  type CompleteExchangeIntentResult,
  type StartExchangeIntentResult,
} from "@ledgerhq/live-common/exchange/intents/index";
import type { Exchange } from "@ledgerhq/live-common/exchange/types";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import type { Operation } from "@ledgerhq/types-live";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor/ContextInitializer/utils/buildDeviceInitializationInput";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import { DrawerClosedError } from "./errors";
import type {
  ExchangeSession,
  ExchangeSessionCompleteRequest,
  ExchangeSessionJobPhase,
  ExchangeSessionManifest,
  ExchangeSessionPhase,
  ExchangeSessionStartRequest,
} from "./types";

type BuildInitializationInput = (
  exchange: Partial<Exchange> | undefined,
) => Promise<InitializationInput>;

type PhaseOf<Step extends ExchangeSessionPhase["step"]> = Extract<
  ExchangeSessionPhase,
  { step: Step }
>;

/** The phases a request can open a session on. */
type OpeningPhase = PhaseOf<"start"> | PhaseOf<"confirm">;

/** The start hook names the exchange type, the complete hooks give its number. */
function getExchangeType(phase: OpeningPhase): number {
  return phase.step === "start"
    ? ExchangeType[phase.request.exchangeParams.exchangeType]
    : phase.request.exchangeParams.exchangeType;
}

function isJobPhase(phase: ExchangeSessionPhase): phase is ExchangeSessionJobPhase {
  return phase.step === "start" || phase.step === "confirm" || phase.step === "error";
}

/** What the jobs of the current phase reported, kept until the phase's job completes. */
type PhaseResults = {
  start?: StartExchangeIntentResult;
  confirm?: CompleteExchangeIntentResult;
};

type OpeningRequest = Readonly<{
  manifestId: string;
  /** Answers the request that was waiting for the device to be prepared. */
  answer: (error: Error) => void;
}>;

/** The Exchange app and the coin apps of the accounts, resolved the way the legacy flow did. */
const buildExchangeInitializationInput: BuildInitializationInput = exchange =>
  buildDeviceInitializationInput({
    appRequest: buildExchangeAppRequest(getExchangeMainAccounts(exchange)),
    flow: FlowName.unknown,
  });

/**
 * The device session shared by the `custom.exchange.*` hooks of a wallet-api live app.
 *
 * One Device Intent Executor drawer is mounted for as long as a session is open, so the user
 * connects the device and has the Exchange app opened once for the nonce, the confirmation and
 * the signature. The hooks only talk to this store: they ask for a step, and are answered through
 * the callbacks of their request once the drawer has run it.
 *
 * The drawer never changes the intent or the initialization input of a running job, so a request
 * that arrives while a step is running does not join it: it replaces it. The live app asking for
 * the device again is the user's latest intent, and the step it is replacing has nobody left to
 * answer to, so refusing the new request would only leave the old drawer in the way.
 */
export class ExchangeDeviceSession {
  private session: ExchangeSession | null = null;
  private nextSessionId = 1;
  private readonly listeners = new Set<() => void>();
  private results: PhaseResults = {};
  /** The request whose initialization input is being built, if any. */
  private opening: OpeningRequest | null = null;
  /** Broadcasts sent to the network: their outcome answers their request, drawer or not. */
  private readonly startedBroadcasts = new WeakSet<PhaseOf<"broadcast">>();

  constructor(
    private readonly buildInitializationInput: BuildInitializationInput = buildExchangeInitializationInput,
  ) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ExchangeSession | null => this.session;

  // ---- Requests from the wallet-api hooks ----

  async requestStart(request: ExchangeSessionStartRequest): Promise<void> {
    this.abandonUnfinishedStep();

    // Prepare the device again: the Exchange app may have been left since the last step, and
    // this is a no-op when it is still open.
    await this.open(
      request.manifest,
      request.exchangeParams.exchange,
      { step: "start", request },
      error => request.onCancel(error),
    );
  }

  async requestComplete(request: ExchangeSessionCompleteRequest): Promise<void> {
    this.abandonUnfinishedStep();

    if (this.session?.manifest.id === request.manifest.id) {
      // Same device context as the start: only the intent changes.
      this.setPhase({ step: "confirm", request });
      return;
    }

    await this.open(
      request.manifest,
      request.exchangeParams.exchange,
      { step: "confirm", request },
      error => request.onCancel(error),
    );
  }

  // ---- Results from the drawer ----

  recordStartResult(phase: PhaseOf<"start">, result: StartExchangeIntentResult): void {
    if (this.isCurrent(phase)) this.results.start = result;
  }

  recordConfirmResult(phase: PhaseOf<"confirm">, result: CompleteExchangeIntentResult): void {
    if (this.isCurrent(phase)) this.results.confirm = result;
  }

  /** The job of `phase` completed: this is the only moment the flow moves on. */
  completePhase(phase: ExchangeSessionPhase): void {
    if (!this.isCurrent(phase)) return;

    const results = this.results;
    this.results = {};

    switch (phase.step) {
      case "start":
        this.completeStart(phase, results.start);
        return;
      case "confirm":
        this.completeConfirm(phase, results.confirm);
        return;
      case "awaiting-complete":
      case "broadcast":
      case "refused":
      case "error":
        return;
    }
  }

  /** A job errored instead of reporting a state, which the jobs are not meant to do. */
  failPhase(phase: ExchangeSessionPhase, error: Error): void {
    if (!this.isCurrent(phase)) return;
    this.results = {};

    if (phase.step === "start") {
      this.showErrorPhase({ error });
      phase.request.onCancel(error);
    } else if ("request" in phase) {
      this.fail(phase.request, error);
    }
  }

  /**
   * The drawer is about to send the signed operation. Returns false when it must not: the flow
   * left the phase, or its operation was sent already.
   */
  startBroadcast(phase: PhaseOf<"broadcast">): boolean {
    if (!this.isCurrent(phase) || this.startedBroadcasts.has(phase)) return false;
    this.startedBroadcasts.add(phase);
    return true;
  }

  /** The transaction is on the network: the request learns it even if its drawer is gone. */
  broadcastSucceeded(phase: PhaseOf<"broadcast">, operation: Operation): void {
    // Close first: the callback can unmount the drawer, which would reject the request.
    if (this.isCurrent(phase)) this.close();
    phase.request.onSuccess(operation);
  }

  broadcastFailed(phase: PhaseOf<"broadcast">, error: Error): void {
    if (this.isCurrent(phase)) {
      this.fail(phase.request, error);
    } else {
      phase.request.onCancel(error);
    }
  }

  // ---- Closing ----

  /**
   * The user closed the drawer. After a refusal, that is the answer to the pending request.
   *
   * The sheet can report a close after its executor is gone, so a drawer passes the id of its
   * session and a close for any other session is ignored.
   */
  userClosed(sessionId?: number): void {
    if (sessionId !== undefined && this.session?.id !== sessionId) return;
    this.end(new DrawerClosedError());
  }

  /**
   * The device of the drawer of `sessionId` disconnected. Reconnecting prepares the device again,
   * which drops the transaction the Exchange app started, so past the nonce the exchange ends with
   * the error instead of letting the executor's retry replay a step of it. Before the nonce, the
   * retry simply starts over, and an error screen has nothing left to lose.
   */
  deviceDisconnected(sessionId: number): void {
    const session = this.session;
    if (session?.id !== sessionId) return;
    if (session.phase.step === "start" || session.phase.step === "error") return;
    this.end(new DisconnectedDeviceDuringOperation());
  }

  /**
   * Tells the user about an error reported outside the device steps (the swap could not get its
   * payload, for example), in the drawer that is open. Returns false when there is no drawer in a
   * state to show it, so the caller can fall back to its own error screen.
   */
  showError(manifestId: string, error: Error): boolean {
    const session = this.session;
    if (session?.manifest.id !== manifestId) return false;

    const { phase } = session;
    switch (phase.step) {
      case "awaiting-complete":
        this.showErrorPhase({ error });
        return true;
      case "error":
        // The reported error is the final one: it replaces what a step reported before it.
        this.showErrorPhase({ ...phase.details, error });
        return true;
      case "refused":
        // The drawer already tells the user about the refusal.
        return true;
      case "start":
      case "confirm":
      case "broadcast":
        return false;
    }
  }

  /**
   * Ends the session of `manifestId`, rejecting whatever it was still waiting for, except a
   * broadcast already sent, which answers its request itself.
   */
  closeForManifest(manifestId: string): void {
    // A session still being prepared has no drawer to close yet, but it must not open later.
    if (this.opening?.manifestId === manifestId) this.abandonOpening();
    if (this.session?.manifest.id === manifestId) this.userClosed();
  }

  /** Ends the session without answering anyone: nothing is waiting for it anymore. */
  close(): void {
    if (!this.session) return;
    this.results = {};
    this.session = null;
    this.notify();
  }

  // ---- Internals ----

  /**
   * Clears the way for a new request: whatever is still preparing or running on the device is
   * given up and answered as closed, which the live app treats as the user moving on. A broadcast
   * already sent still answers its own request. A session that is only waiting between two steps
   * stays, so its drawer is reused.
   */
  private abandonUnfinishedStep(): void {
    this.abandonOpening();

    const phase = this.session?.phase;
    if (phase && phase.step !== "awaiting-complete") this.userClosed();
  }

  private abandonOpening(): void {
    const opening = this.opening;
    if (!opening) return;

    this.opening = null;
    opening.answer(new DrawerClosedError());
  }

  private async open(
    manifest: ExchangeSessionManifest,
    exchange: Partial<Exchange> | undefined,
    phase: OpeningPhase,
    onFailure: (error: Error) => void,
  ): Promise<void> {
    const attempt: OpeningRequest = { manifestId: manifest.id, answer: onFailure };
    this.opening = attempt;

    let initializationInput: InitializationInput;
    try {
      initializationInput = await this.buildInitializationInput(exchange);
    } catch (error) {
      if (this.opening === attempt) {
        this.opening = null;
        onFailure(normalizeError(error));
      }
      return;
    }

    // Another request took over, or the session was closed, while the device was being prepared:
    // this request has been answered already.
    if (this.opening !== attempt) return;
    this.opening = null;

    // An idle session of the same live app keeps its executor, which prepares the device again.
    // Anything else gets a new id, so its drawer starts from a fresh executor.
    const reusableSession =
      this.session?.manifest.id === manifest.id && this.session.phase.step === "awaiting-complete"
        ? this.session
        : null;

    // The phase and the input change in the same update, as the executor needs.
    this.results = {};
    this.session = {
      id: reusableSession?.id ?? this.nextSessionId++,
      manifest,
      exchangeType: getExchangeType(phase),
      initializationInput,
      phase,
      jobPhase: phase,
    };
    this.notify();
  }

  private completeStart(phase: PhaseOf<"start">, result: StartExchangeIntentResult | undefined) {
    const { request } = phase;
    if (!result) {
      const error = new Error("The exchange start ended without a result");
      this.showErrorPhase({ error });
      request.onCancel(error);
      return;
    }
    if (result.status === "failed") {
      this.showErrorPhase({ error: result.error });
      request.onCancel(result.error, result.device);
      return;
    }

    if (request.continuesOnDevice) {
      this.setPhase({ step: "awaiting-complete" });
    } else {
      this.close();
    }
    request.onSuccess(result.nonce, result.device, {
      ...(result.exchangeAppVersion ? { exchangeAppVersion: result.exchangeAppVersion } : {}),
      ...(result.signingAppName ? { signingAppName: result.signingAppName } : {}),
      ...(result.signingAppVersion ? { signingAppVersion: result.signingAppVersion } : {}),
    });
  }

  private completeConfirm(
    phase: PhaseOf<"confirm">,
    result: CompleteExchangeIntentResult | undefined,
  ) {
    const { request } = phase;
    if (!result) {
      this.fail(request, new Error("The exchange confirmation ended without a result"));
    } else if (result.status === "failed") {
      this.fail(request, result.error, result.deviceModelId);
    } else if (result.status === "refused") {
      this.setPhase({
        step: "refused",
        request,
        error: result.error ?? new TransactionRefusedOnDevice(),
      });
    } else {
      this.setPhase({ step: "broadcast", request, signedOperation: result.signedOperation });
    }
  }

  /**
   * Answers the request with its error and has the drawer tell the user, unless `executeSwap` is
   * about to start the swap again: its next start then reuses the open drawer.
   *
   * `deviceModelId` is the device the Exchange app confirmation failed on, when it is known.
   */
  private fail(
    request: ExchangeSessionCompleteRequest,
    error: Error,
    deviceModelId?: DeviceModelId,
  ): void {
    if (getIsSwapRetryPending(request.exchangeParams, error)) {
      this.setPhase({ step: "awaiting-complete" });
    } else {
      const { provider, exchange } = request.exchangeParams;
      this.showErrorPhase({
        error,
        provider,
        ...(deviceModelId ? { deviceModelId } : {}),
        ...(exchange.fromCurrency?.id ? { sourceCurrencyId: exchange.fromCurrency.id } : {}),
        ...("toCurrency" in exchange && exchange.toCurrency?.id
          ? { targetCurrencyId: exchange.toCurrency.id }
          : {}),
      });
    }
    request.onCancel(error);
  }

  /** The executor, still open, moves on to the intent that tells the user. */
  private showErrorPhase(details: ShowExchangeErrorIntentInput): void {
    this.setPhase({ step: "error", details });
  }

  private setPhase(phase: ExchangeSessionPhase): void {
    if (!this.session) return;
    this.results = {};
    this.session = {
      ...this.session,
      phase,
      jobPhase: isJobPhase(phase) ? phase : this.session.jobPhase,
    };
    this.notify();
  }

  /**
   * Ends the session and answers what it was waiting for with `error`. A refusal stays the answer
   * of a refused step, and a broadcast already sent answers its request itself.
   */
  private end(error: Error): void {
    const phase = this.session?.phase;
    if (!phase) return;

    this.close();
    if (phase.step === "refused") {
      phase.request.onCancel(phase.error);
    } else if ("request" in phase && !this.isSentBroadcast(phase)) {
      phase.request.onCancel(error);
    }
  }

  private isSentBroadcast(phase: ExchangeSessionPhase): boolean {
    return phase.step === "broadcast" && this.startedBroadcasts.has(phase);
  }

  private isCurrent(phase: ExchangeSessionPhase): boolean {
    return this.session?.phase === phase;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

export const exchangeDeviceSession = new ExchangeDeviceSession();
