// Experiment for QAA-1501, not for develop: notes each Redux dispatch for the JS-block events, and
// logs a startup event for each dispatch of 10 ms or more before the app has started.
import type { Middleware } from "@reduxjs/toolkit";
import { logStartupEvent, startupEvents } from "../logStartupTime";
import { noteDispatch } from "./logStartupJsBlocks";

const LOGGED_FROM_MS = 10;
const MAX_LOGGED = 30;
let logged = 0;

const started = () => startupEvents.some(e => e.event === "App started");

export const logStartupActions: Middleware = () => next => action => {
  const start = Date.now();
  const result = next(action);
  const end = Date.now();
  const type =
    typeof action === "function" ? "thunk" : ((action as { type?: string }).type ?? "unknown");
  noteDispatch({ type, start, end });
  if (end - start >= LOGGED_FROM_MS && logged < MAX_LOGGED && !started()) {
    logged += 1;
    logStartupEvent(`Dispatch ${logged} ${type} took ${end - start} ms`);
  }
  return result;
};
