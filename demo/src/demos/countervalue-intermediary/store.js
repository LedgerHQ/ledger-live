// @flow
import { createStore, applyMiddleware, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunkMiddleware from "redux-thunk";
import app from "./reducers/app";
import CounterValues from "./countervalues";

export const initStore = () =>
  createStore(
    combineReducers({
      app,
      countervalues: CounterValues.reducer
    }),
    composeWithDevTools(applyMiddleware(thunkMiddleware))
  );
