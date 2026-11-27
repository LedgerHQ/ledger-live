import type { Action } from "@reduxjs/toolkit";
import { accountContextReceived, accountContextSlice, legacyAccountContextsSynced } from "./slice";

export const REDACTED_ACCOUNT_CONTEXT = "[REDACTED]";

const redactContext = (context: object): Record<string, string> =>
  Object.fromEntries(Object.keys(context).map(field => [field, REDACTED_ACCOUNT_CONTEXT]));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const withPayload = <A>(action: A, payload: unknown): A => ({ ...action, payload }) as A;

export function redactAccountContextAction<A extends Action>(action: A): A {
  if (accountContextReceived.match(action)) {
    const { payload } = action;
    return withPayload(action, { ...payload, context: redactContext(payload.context) });
  }
  if (legacyAccountContextsSynced.match(action)) {
    const { payload } = action;
    return withPayload(action, {
      ...payload,
      contexts: payload.contexts.map(entry => ({
        ...entry,
        context: redactContext(entry.context),
      })),
    });
  }
  return action;
}

export function redactAccountContextState<S>(state: S): S {
  if (!isRecord(state)) return state;
  const slice = state[accountContextSlice.reducerPath];
  if (!isRecord(slice)) return state;
  const redacted = Object.fromEntries(
    Object.entries(slice).map(([accountUUID, context]) => [
      accountUUID,
      isRecord(context) ? redactContext(context) : context,
    ]),
  );
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...state, [accountContextSlice.reducerPath]: redacted } as S;
}
