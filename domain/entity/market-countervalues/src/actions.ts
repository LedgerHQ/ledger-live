import { createAction } from "@reduxjs/toolkit";
import type { CounterValuesState } from "./types";

// Plain string types, not `countervaluesRates/...`: reducers outside this package match them.

/** Replaces the stored rates with a freshly loaded or restored state. */
export const setCountervaluesState = createAction<CounterValuesState>("COUNTERVALUES_STATE_SET");

/** Drops every stored rate. */
export const wipeCountervalues = createAction("COUNTERVALUES_WIPE");
