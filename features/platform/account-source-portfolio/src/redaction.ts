import type { Action } from "@reduxjs/toolkit";
import { portfolioSourceSlice } from "./slice";

const REDACTED = "[REDACTED]";
const PREFIX = `${portfolioSourceSlice.name}/`;

/** A copy safe to log: the portfolio id, addresses, xpubs and service account ids are replaced. */
export function redactPortfolioSourceAction<A extends Action>(action: A): A {
  if (!action.type.startsWith(PREFIX) || !("payload" in action)) return action;
  if (typeof action.payload === "boolean") return action;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...action, payload: REDACTED } as A;
}

/** A copy of the store safe to export: the source's slice is replaced. */
export function redactPortfolioSourceState<S>(state: S): S {
  if (typeof state !== "object" || state === null || !(portfolioSourceSlice.name in state)) {
    return state;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...state, [portfolioSourceSlice.name]: REDACTED } as S;
}
