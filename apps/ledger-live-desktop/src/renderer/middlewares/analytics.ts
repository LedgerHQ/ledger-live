import type { Middleware } from "redux";
import { start } from "~/renderer/analytics/segment";
import type { State } from "../reducers";

let isAnalyticsStarted = false;

export const analyticsMiddleware: Middleware<{}, State> = store => next => action => {
  next(action);
  if (!isAnalyticsStarted) {
    isAnalyticsStarted = true;
    start(store);
  }
};
