import { useCallback, useEffect, useRef, useState } from "react";
import type { Transport } from "@ledgerhq/wallet-api-core";
import { BridgeSessionClosed } from "../errors";
import { isUrlAllowedByManifestDomains } from "./manifestDomainUtils";

/** Posts a message to the webview main frame, only if its document is on `targetOrigin`. */
export type PostMessageToOrigin = (message: string, targetOrigin: string) => void;

/** Who sent a bridge message, as reported by the platform (never by the page itself). */
export type BridgeSender = {
  /** URL or origin of the frame that sent the message */
  url: string | undefined;
  /**
   * `undefined` when the platform cannot tell, which only passes with the domain check off. On
   * Android, the fallback bridge (`addJavascriptInterface`, no `WEB_MESSAGE_LISTENER`) never
   * tells and is exposed to every frame: with the domain check on its messages are dropped on
   * purpose.
   */
  isMainFrame: boolean | undefined;
};

/**
 * Origin of an http(s) URL, `undefined` for anything else (`about:blank`, `data:`, opaque
 * origins, malformed URLs): the bridge never answers those.
 */
export function getBridgeOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol, origin } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? origin : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The bridge only answers the main frame on an origin of `manifest.domains`.
 * `allowedDomains` is `undefined` when the manifest domain check is off (kill switch): any
 * http(s) origin is then answered, from a frame the platform does not report as a subframe.
 */
export function isBridgeSenderAllowed(
  sender: BridgeSender,
  allowedDomains: string[] | undefined,
): boolean {
  const origin = getBridgeOrigin(sender.url);
  if (!origin || sender.isMainFrame === false) return false;
  if (allowedDomains === undefined) return true;
  return sender.isMainFrame === true && isUrlAllowedByManifestDomains(origin, allowedDomains);
}

/**
 * A wallet bridge session serves a single main-frame origin, and is the transport of the
 * Wallet API / Platform API server created for it:
 * - replies are posted to the session origin only, so a reply never reaches another origin;
 * - when the main frame moves to another origin the session is closed: its pending requests
 *   are rejected and anything it still tries to send is dropped.
 *
 * Messages are queued until the server of the session has registered its handlers (`activate`).
 */
const noop = () => {};

/** A promise rejected on demand, observed so that nobody has to observe it. */
function createClosedSignal(): { promise: Promise<never>; reject: (error: Error) => void } {
  let reject: (error: Error) => void = noop;
  const promise = new Promise<never>((_, rejectPromise) => {
    reject = rejectPromise;
  });
  promise.catch(noop);
  return { promise, reject };
}

export class BridgeSession implements Transport {
  onMessage: Transport["onMessage"] = undefined;

  private readonly closedSignal = createClosedSignal();

  /** Rejects once the session is closed. */
  readonly closed: Promise<never> = this.closedSignal.promise;

  private currentOrigin: string | undefined;
  private isActive = false;
  private isClosed = false;
  private activeUiFlows = 0;
  private queue: Array<() => void> = [];
  private readonly closeListeners = new Set<(error: Error) => void>();

  constructor(
    origin: string | undefined,
    private readonly postMessage: PostMessageToOrigin,
  ) {
    this.currentOrigin = origin;
  }

  get origin(): string | undefined {
    return this.currentOrigin;
  }

  get isOpen(): boolean {
    return !this.isClosed;
  }

  /**
   * Whether a UI flow of the session is still open (see `bindUiFlowToSession`, `trackUiFlow`):
   * nothing else is theirs to close.
   */
  get hasActiveUiFlow(): boolean {
    return this.activeUiFlows > 0;
  }

  /** Throws `BridgeSessionClosed` once the session is closed: call it before an irreversible step. */
  assertOpen(): void {
    if (this.isClosed) throw new BridgeSessionClosed();
  }

  /** Counts a UI flow as open until the returned `end` is called (only the first call counts). */
  openUiFlow(): () => void {
    this.activeUiFlows++;
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      this.activeUiFlows--;
    };
  }

  /** Counts the UI flow of `promise` as open until it settles. */
  trackUiFlow<T>(promise: Promise<T>): Promise<T> {
    const end = this.openUiFlow();
    promise.then(end, end);
    return promise;
  }

  /**
   * Binds a session that has no origin yet (nothing loaded or received so far).
   * Returns whether the session serves `origin`.
   */
  bind(origin: string): boolean {
    if (this.isClosed) return false;
    this.currentOrigin ??= origin;
    return this.currentOrigin === origin;
  }

  send = (message: string): void => {
    if (this.isClosed || this.currentOrigin === undefined) return;
    this.postMessage(message, this.currentOrigin);
  };

  /** Hands an incoming message to the session server once it is ready. */
  receive(message: string): void {
    this.deliver(() => this.onMessage?.(message));
  }

  /** Runs `handle` once the session server is ready, never after the session is closed. */
  deliver(handle: () => void): void {
    if (this.isClosed) return;
    if (this.isActive) {
      handle();
    } else {
      this.queue.push(handle);
    }
  }

  /** Called by the session server once its handlers are registered. */
  activate(): void {
    if (this.isClosed || this.isActive) return;
    this.isActive = true;
    const queued = this.queue;
    this.queue = [];
    // A queued handler may close the session: the next ones must not run then.
    queued.forEach(handle => this.deliver(handle));
  }

  /** Settles like `promise`, or rejects with `BridgeSessionClosed` once the session is closed. */
  cancelOnClose<T>(promise: Promise<T> | T): Promise<T> {
    if (this.isClosed) {
      // Observed so that a request failing after the close is not an unhandled rejection.
      Promise.resolve(promise).catch(() => {});
      return Promise.reject(new BridgeSessionClosed());
    }
    return new Promise<T>((resolve, reject) => {
      // Removed once the request settles, so a long-lived session does not retain them.
      this.closeListeners.add(reject);
      Promise.resolve(promise)
        .then(resolve, reject)
        .finally(() => this.closeListeners.delete(reject));
    });
  }

  /**
   * Wraps the continuation of a request (opening a UI, broadcasting...) so that it rejects with
   * `BridgeSessionClosed` instead of running once the session is closed: a request still
   * preparing when the main frame changed origin must not act for the next origin.
   */
  whileOpen<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    return (...args: A): R => {
      if (this.isClosed) throw new BridgeSessionClosed();
      return fn(...args);
    };
  }

  close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.queue = [];
    this.onMessage = undefined;
    const error = new BridgeSessionClosed();
    this.closeListeners.forEach(reject => reject(error));
    this.closeListeners.clear();
    this.closedSignal.reject(error);
  }
}

/**
 * Ties a UI flow to the session of the request that opens it: the flow is not opened once the
 * session is closed (the request may still have been preparing), and its callbacks are dropped
 * after that, e.g. a device connected late is not handed over to the next origin.
 * The flow counts as open until one of its callbacks runs.
 */
export function bindUiFlowToSession<P extends object, R>(
  session: BridgeSession,
  open: (params: P) => R,
): (params: P) => R | undefined {
  return params => {
    if (!session.isOpen) return undefined;
    const end = session.openUiFlow();
    const boundParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        typeof value === "function"
          ? (...args: unknown[]) => {
              if (!session.isOpen) return undefined;
              end();
              return value(...args);
            }
          : value,
      ]),
    );
    try {
      return open(boundParams as P);
    } catch (error) {
      end();
      throw error;
    }
  };
}

type UseBridgeSessionParams = {
  postMessage: PostMessageToOrigin;
  /** Called when the main frame moved to another origin, e.g. to close open drawers. */
  onReset?: (closedSession: BridgeSession) => void;
};

export type BridgeSessionController = {
  /** The session the current render serves. */
  session: BridgeSession;
  /**
   * Returns the session a message from `origin` (already checked with `isBridgeSenderAllowed`)
   * belongs to, or `undefined` when it must be dropped.
   * - A message from an origin the session already left is late: it is dropped and the session
   *   is left untouched, only navigation events move the session back.
   * - A message from any other origin than the session's means the main frame moved without a
   *   navigation event reaching us first: the session is reset to that origin and serves it.
   */
  accept: (origin: string) => BridgeSession | undefined;
  /** Reports a main-frame URL (load start or commit): resets the session on an origin change. */
  onMainFrameNavigation: (url: string | undefined) => void;
};

/** One bridge session per main-frame origin, reset on every origin change. */
export function useBridgeSession({
  postMessage,
  onReset,
}: UseBridgeSessionParams): BridgeSessionController {
  const postMessageRef = useRef(postMessage);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    postMessageRef.current = postMessage;
    onResetRef.current = onReset;
  }, [postMessage, onReset]);

  const post = useCallback<PostMessageToOrigin>(
    (message, targetOrigin) => postMessageRef.current(message, targetOrigin),
    [],
  );

  const [session, setSession] = useState(() => new BridgeSession(undefined, post));
  const sessionRef = useRef(session);
  // Origins the session served then left: a late message from one of them is not a navigation.
  const leftOriginsRef = useRef(new Set<string>());

  // Closes the session when its view goes away. A replayed effect (Strict Mode) reopens one.
  useEffect(() => {
    if (!sessionRef.current.isOpen) {
      const reopened = new BridgeSession(sessionRef.current.origin, post);
      sessionRef.current = reopened;
      setSession(reopened);
    }
    return () => sessionRef.current.close();
  }, [post]);

  const reset = useCallback(
    (origin: string | undefined) => {
      const closedSession = sessionRef.current;
      closedSession.close();
      if (closedSession.origin !== undefined) leftOriginsRef.current.add(closedSession.origin);
      if (origin !== undefined) leftOriginsRef.current.delete(origin);
      const nextSession = new BridgeSession(origin, post);
      sessionRef.current = nextSession;
      setSession(nextSession);
      onResetRef.current?.(closedSession);
    },
    [post],
  );

  const accept = useCallback(
    (origin: string): BridgeSession | undefined => {
      const current = sessionRef.current;
      if (leftOriginsRef.current.has(origin)) return undefined;
      if (current.bind(origin)) return current;
      reset(origin);
      return sessionRef.current;
    },
    [reset],
  );

  const onMainFrameNavigation = useCallback(
    (url: string | undefined) => {
      const origin = getBridgeOrigin(url);
      const current = sessionRef.current;
      if (current.origin === origin) return;
      if (current.origin === undefined && origin !== undefined) {
        leftOriginsRef.current.delete(origin);
        current.bind(origin);
        return;
      }
      reset(origin);
    },
    [reset],
  );

  return { session, accept, onMainFrameNavigation };
}
