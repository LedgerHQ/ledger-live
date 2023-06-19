import { Middleware } from "redux";
import { start } from "~/renderer/analytics/segment";
import createStore from "../createStore";
import { State } from "../reducers";
let isAnalyticsStarted = false;

type ReduxStore = ReturnType<typeof createStore>;

const analyticsMiddleware: Middleware<{}, State> = store => next => action => {
  next(action);
  if (!isAnalyticsStarted) {
    isAnalyticsStarted = true;
    start(store as ReduxStore);
  }
};
export default analyticsMiddleware;
