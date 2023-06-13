import { Middleware } from "redux";
import logger from "~/renderer/logger";
import { State } from "../reducers";

const loggerMiddleware: Middleware<{}, State> = () => next => action => {
  logger.onReduxAction(action);
  return next(action);
};

export default loggerMiddleware;
