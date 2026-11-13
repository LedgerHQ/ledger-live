// Experiment for QAA-1501, not for develop: a startup event for each Redux action dispatched before
// the app has started, with how long its dispatch took, to name the JS work the startup waits on.
import type { Middleware } from "@reduxjs/toolkit";
import { logStartupEvent, startupEvents } from "../logStartupTime";

const MAX_LOGGED = 250;
let logged = 0;

const started = () => startupEvents.some(e => e.event === "App started");

export const logStartupActions: Middleware = () => next => action => {
  if (logged >= MAX_LOGGED || started()) return next(action);
  const start = Date.now();
  const result = next(action);
  logged += 1;
  const type =
    typeof action === "function" ? "thunk" : ((action as { type?: string }).type ?? "unknown");
  logStartupEvent(`Action ${logged} ${type} took ${Date.now() - start} ms`);
  return result;
};
