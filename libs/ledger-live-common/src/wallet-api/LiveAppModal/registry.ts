import { v4 as uuidv4 } from "uuid";
import { LiveAppModalAlreadyOpenError, LiveAppModalUnknownRequestIdError } from "./types";

type Entry = {
  payload: unknown;
  resolve: (result: { result?: unknown }) => void;
  reject: (err: Error) => void;
  closeHandler?: () => void;
  settled: boolean;
};

const entries = new Map<string, Entry>();

function hasOpenRequest(): boolean {
  for (const entry of entries.values()) {
    if (!entry.settled) return true;
  }
  return false;
}

export function createRequest(params: { payload?: unknown }): {
  requestId: string;
  promise: Promise<{ result?: unknown }>;
} {
  if (hasOpenRequest()) {
    throw new LiveAppModalAlreadyOpenError();
  }
  const requestId = uuidv4();
  const promise = new Promise<{ result?: unknown }>((resolve, reject) => {
    entries.set(requestId, {
      payload: params.payload,
      resolve,
      reject,
      settled: false,
    });
  });
  return { requestId, promise };
}

export function getPayload(requestId: string): unknown {
  const entry = entries.get(requestId);
  if (!entry || entry.settled) {
    throw new LiveAppModalUnknownRequestIdError(requestId);
  }
  return entry.payload;
}

export function registerCloseHandler(requestId: string, handler: () => void): void {
  const entry = entries.get(requestId);
  if (!entry || entry.settled) return;
  entry.closeHandler = handler;
}

export function close(requestId: string, result?: unknown): void {
  const entry = entries.get(requestId);
  if (!entry || entry.settled) return;
  entry.settled = true;
  try {
    entry.closeHandler?.();
  } finally {
    entry.resolve({ result });
    entries.delete(requestId);
  }
}

export function dismiss(requestId: string): void {
  const entry = entries.get(requestId);
  if (!entry || entry.settled) return;
  entry.settled = true;
  entry.resolve({ result: undefined });
  entries.delete(requestId);
}

export function cancel(requestId: string, error: Error): void {
  const entry = entries.get(requestId);
  if (!entry || entry.settled) return;
  entry.settled = true;
  entry.reject(error);
  entries.delete(requestId);
}

export function __resetForTests(): void {
  for (const entry of entries.values()) {
    // Mark as settled so leaked-over promises from a previous test cannot
    // accidentally interact with new entries. The underlying promise will
    // stay pending and be garbage-collected if no one awaits it.
    entry.settled = true;
  }
  entries.clear();
}
