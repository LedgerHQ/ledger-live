/**
 * Generic request/response resolver keyed by {@link RequestId}.
 *
 * Factors out the `Map<RequestId, { resolve, reject }>` plumbing that the
 * Electron main-process bridge needs for every one-shot utility call
 * (`getChainTip`, and any future one-shot methods such as `getBalance`,
 * `getTransaction`, ...).
 *
 * Streaming methods (like `syncShielded`) don't use this -- they have their
 * own state per subscription and funnel errors through `StreamEvent.kind =
 * "error"` instead. See the error-reporting conventions in `contract.ts`.
 *
 * Usage (host-side):
 *
 *   const chainTipResolvers = new OneShotResolver<number>("chain-tip");
 *
 *   // when receiving an IPC request from the renderer:
 *   const result = chainTipResolvers.register(args.requestId, () =>
 *     postToUtility({ type: "get-chain-tip", args }),
 *   );
 *
 *   // when a message comes back from the utility:
 *   chainTipResolvers.resolve(msg.requestId, msg.height);
 *   // or on error:
 *   chainTipResolvers.reject(msg.requestId, new Error(msg.message));
 *
 *   // on utility exit:
 *   chainTipResolvers.failAll(new Error("utility exited"));
 */

import type { RequestId } from "./contract";

type PendingResolver<T> = {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
};

export class OneShotResolver<T> {
  /** Label used in error messages for unknown requestIds. */
  private readonly kind: string;
  private readonly pending = new Map<RequestId, PendingResolver<T>>();

  constructor(kind: string) {
    this.kind = kind;
  }

  /**
   * Registers a pending resolver, fires the `dispatch` side-effect that posts
   * the request down to the utility, and returns a promise that resolves when
   * the utility replies (or rejects on `reject()` / `failAll()` / dispatch
   * failure).
   *
   * If `dispatch` itself throws or rejects, the pending entry is cleaned up
   * immediately -- the caller sees the original error and doesn't leak an
   * entry that no reply will ever match.
   */
  async register(requestId: RequestId, dispatch: () => Promise<void>): Promise<T> {
    const result = new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
    });
    try {
      await dispatch();
    } catch (err) {
      this.pending.delete(requestId);
      throw err;
    }
    return result;
  }

  /**
   * Resolves the pending request with `value`. No-op (with a silent drop) if
   * the id is unknown -- happens legitimately after `failAll()` or when the
   * utility sends a late reply for a cancelled request.
   */
  resolve(requestId: RequestId, value: T): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) return false;
    this.pending.delete(requestId);
    entry.resolve(value);
    return true;
  }

  /** Symmetric to {@link resolve}. Returns `false` on unknown id. */
  reject(requestId: RequestId, err: Error): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) return false;
    this.pending.delete(requestId);
    entry.reject(err);
    return true;
  }

  /**
   * Fails every in-flight request with `err`. Use on utility exit so callers
   * don't hang forever.
   */
  failAll(err: Error): void {
    for (const entry of this.pending.values()) {
      entry.reject(err);
    }
    this.pending.clear();
  }

  /** Size accessor for diagnostics / tests. */
  get size(): number {
    return this.pending.size;
  }

  /** Label accessor for log messages. */
  get label(): string {
    return this.kind;
  }
}
