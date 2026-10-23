import { isAction, type Middleware } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import type { AccountDataSource } from "@domain/api-account-data";
import {
  accountDataFailed,
  accountDataRequested,
  isAnyAccountDataReceived,
} from "@domain/entity-account-data";

type AccountDataToolEvent = Extract<
  DevToolsConfig[number],
  { id: "account-data" }
>["config"]["events"][number];

const isRejected = (settled: unknown) =>
  typeof settled === "object" &&
  settled !== null &&
  "status" in settled &&
  settled.status === "rejected";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Records what the account data layer does, for the account-data devtool. */
export type AccountDataRecorder = {
  /** Records the reads requested, received and failed. */
  readonly middleware: Middleware;
  /** The same sources, recording each call the router makes on them. */
  instrument(sources: readonly AccountDataSource[]): AccountDataSource[];
  subscribe(listener: () => void): () => void;
  getEvents(): readonly AccountDataToolEvent[];
  clear(): void;
};

export function createAccountDataRecorder({ limit = 500 } = {}): AccountDataRecorder {
  let events: readonly AccountDataToolEvent[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();
  const requestedAt = new Map<string, number>();

  const record = (event: DistributiveOmit<AccountDataToolEvent, "id" | "at">) => {
    events = [...events, { ...event, id: nextId++, at: Date.now() }].slice(-limit);
    listeners.forEach(listener => listener());
  };

  const elapsedSince = (requestId: string) => {
    const start = requestedAt.get(requestId);
    requestedAt.delete(requestId);
    return start === undefined ? undefined : Date.now() - start;
  };

  const middleware: Middleware = () => next => action => {
    if (accountDataRequested.match(action)) {
      const { kind, accountUUID, requestId, queryKey, append } = action.payload;
      requestedAt.set(requestId, Date.now());
      record({ type: "requested", kind, accountUUID, requestId, queryKey, append });
    } else if (accountDataFailed.match(action)) {
      const { kind, accountUUID, requestId, error } = action.payload;
      const elapsedMs = elapsedSince(requestId);
      record({
        type: "failed",
        kind,
        accountUUID,
        requestId,
        error: `${error.name}: ${error.message}`,
        elapsedMs,
      });
    } else if (isAction(action) && isAnyAccountDataReceived(action)) {
      const { kind, accountUUID, requestId, sourceId, append, nextCursor } = action.payload;
      const elapsedMs = elapsedSince(requestId);
      record({
        type: "received",
        kind,
        accountUUID,
        requestId,
        sourceId,
        append,
        hasMore: nextCursor !== undefined,
        elapsedMs,
      });
    }
    return next(action);
  };

  /** The same readers, each call recorded as a `source-call`. */
  function recorded<T extends object>(readers: T, sourceId: string, batch: boolean): T {
    return new Proxy(readers, {
      get: (target, kind) => {
        const reader: unknown = Reflect.get(target, kind);
        if (typeof reader !== "function" || typeof kind !== "string") return reader;
        return async (targets: unknown, query: unknown) => {
          const start = Date.now();
          const accounts = batch && Array.isArray(targets) ? targets.length : 1;
          const report = (failed: number) =>
            record({
              type: "source-call",
              sourceId,
              kind,
              batch,
              accounts,
              failed,
              elapsedMs: Date.now() - start,
            });
          try {
            const result: unknown = await reader(targets, query);
            report(Array.isArray(result) ? result.filter(isRejected).length : 0);
            return result;
          } catch (error) {
            report(accounts);
            throw error;
          }
        };
      },
    });
  }

  const instrument = (sources: readonly AccountDataSource[]): AccountDataSource[] =>
    sources.map(source => ({
      ...source,
      read: source.read && recorded(source.read, source.id, false),
      readBatch: source.readBatch && recorded(source.readBatch, source.id, true),
    }));

  return {
    middleware,
    instrument,
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getEvents: () => events,
    clear: () => {
      events = [];
      listeners.forEach(listener => listener());
    },
  };
}
