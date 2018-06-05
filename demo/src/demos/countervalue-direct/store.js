// @flow
import { createStore, applyMiddleware, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunkMiddleware from "redux-thunk";
import markets from "./reducers/markets";
import CounterValues from "./countervalues";

export const initStore = () =>
  createStore(
    combineReducers({
      markets,
      countervalues: CounterValues.reducer
    }),
    composeWithDevTools(applyMiddleware(thunkMiddleware))
  );
