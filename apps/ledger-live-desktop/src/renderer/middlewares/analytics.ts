import { Middleware } from "redux";
import { start } from "~/renderer/analytics/segment";
import createStore from "../createStore";
let isAnalyticsStarted = false;

type ReduxStore = ReturnType<typeof createStore>;

const analyticsMiddleware: Middleware = store => next => action => {
  next(action);
  if (!isAnalyticsStarted) {
    isAnalyticsStarted = true;
    start(store as ReduxStore);
  }
};
export default analyticsMiddleware;
