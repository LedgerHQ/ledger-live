// @flow
import { createStore, applyMiddleware, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { getCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import thunkMiddleware from "redux-thunk";
import markets from "./reducers/markets";

export const initStore = () =>
  createStore(
    combineReducers({
      markets,
      countervalues: getCountervalues().reducer
    }),
    composeWithDevTools(applyMiddleware(thunkMiddleware))
  );
