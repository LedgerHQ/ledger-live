import { combineReducers } from "@reduxjs/toolkit";
import type { Reducer, ReducersMapObject, Store, UnknownAction } from "redux";

import type { RegisterSliceOptions } from "./types";

export const SLICE_REGISTERED_ACTION = "@@host-runtime/SLICE_REGISTERED";

let staticReducers: ReducersMapObject = {};
const dynamicReducers = new Map<string, Reducer>();
let store: Store | undefined;
let cachedCombined: Reducer | undefined;
let cachedKeysSignature = "";

function buildKeysSignature(): string {
  return [...Object.keys(staticReducers), ...dynamicReducers.keys()].sort().join("|");
}

function rebuildCombined(): Reducer {
  const merged: ReducersMapObject = { ...staticReducers };
  dynamicReducers.forEach((reducer, key) => {
    merged[key] = reducer;
  });
  return combineReducers(merged);
}

function ensureCombined(): Reducer {
  const signature = buildKeysSignature();
  if (cachedCombined === undefined || signature !== cachedKeysSignature) {
    cachedCombined = rebuildCombined();
    cachedKeysSignature = signature;
  }
  return cachedCombined;
}

function setStaticReducers(map: ReducersMapObject): void {
  staticReducers = map;
  cachedCombined = undefined;
}

function attachStore(s: Store): void {
  store = s;
  if (dynamicReducers.size > 0) {
    s.replaceReducer(ensureCombined());
  }
}

function getCombinedReducer(): Reducer {
  return ensureCombined();
}

function registerSlice<S>({ name, reducer }: RegisterSliceOptions<S>): void {
  if (name in staticReducers) {
    console.warn(
      `[mobile-host-runtime] registerSlice("${name}") overlaps with a static reducer; ignoring`,
    );
    return;
  }
  const previous = dynamicReducers.get(name);
  if (previous === reducer) return;
  dynamicReducers.set(name, reducer as Reducer);
  cachedCombined = undefined;
  if (store) {
    store.replaceReducer(ensureCombined());
    store.dispatch({ type: SLICE_REGISTERED_ACTION, payload: name } as UnknownAction);
  }
}

export const reducerRegistry = {
  setStaticReducers,
  attachStore,
  getCombinedReducer,
  registerSlice,
};

export { setStaticReducers, attachStore, getCombinedReducer, registerSlice };
